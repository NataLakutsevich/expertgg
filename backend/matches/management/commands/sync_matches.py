"""Cron entry point: pull matches from PandaScore and resolve bets on newly finished ones.

Intended to run once a minute via the system crontab, e.g.:
    * * * * * cd /path/to/backend && /path/to/venv/bin/python manage.py sync_matches >> /var/log/expertgg-sync.log 2>&1
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from accounts.models import Profile
from matches.models import Bet, Match
from matches.pandascore import fetch_matches

# PandaScore match `status` values -> our Match.Status.
_STATUS_MAP = {
    "not_started": Match.Status.UPCOMING,
    "postponed": Match.Status.UPCOMING,
    "running": Match.Status.RUNNING,
    "finished": Match.Status.FINISHED,
    "canceled": Match.Status.CANCELLED,
    "cancelled": Match.Status.CANCELLED,
}


def _extract_teams(raw_match):
    """PandaScore's `opponents` is a list of up to 2 {"opponent": {...}} wrappers."""
    opponents = raw_match.get("opponents") or []
    names, logos = [], []
    for entry in opponents[:2]:
        opponent = (entry or {}).get("opponent") or {}
        names.append(opponent.get("name") or "TBD")
        logos.append(opponent.get("image_url") or "")
    while len(names) < 2:
        names.append("TBD")
        logos.append("")
    return names[0], logos[0], names[1], logos[1]


def _extract_winner_name(raw_match):
    """Match PandaScore's winner_id/winner object back to one of the two opponents."""
    winner = raw_match.get("winner")
    winner_id = winner.get("id") if isinstance(winner, dict) else raw_match.get("winner_id")
    if not winner_id:
        return None
    for entry in raw_match.get("opponents") or []:
        opponent = (entry or {}).get("opponent") or {}
        if opponent.get("id") == winner_id:
            return opponent.get("name")
    return None


class Command(BaseCommand):
    help = "Sync matches from PandaScore (upcoming/running/past) and resolve bets on finished matches."

    def handle(self, *args, **options):
        synced = 0
        for endpoint in ("upcoming", "running", "past"):
            try:
                raw_matches = fetch_matches(endpoint)
            except Exception as exc:
                # A single failed endpoint (rate limit, network hiccup, etc.)
                # shouldn't stop the other two from syncing this run.
                self.stderr.write(self.style.WARNING(f"[{endpoint}] fetch failed: {exc}"))
                continue

            for raw in raw_matches:
                match = self._upsert_match(raw)
                synced += 1
                if match.status == Match.Status.FINISHED and not match.bets_resolved:
                    self._resolve_bets(match.pk)

        self.stdout.write(self.style.SUCCESS(f"Synced {synced} matches."))

    def _upsert_match(self, raw):
        team1_name, team1_logo, team2_name, team2_logo = _extract_teams(raw)
        league = raw.get("league") or {}
        videogame = raw.get("videogame") or {}

        defaults = {
            "tournament_name": league.get("name") or raw.get("name") or "",
            "videogame": videogame.get("name") or "",
            "team1_name": team1_name,
            "team1_logo_url": team1_logo,
            "team2_name": team2_name,
            "team2_logo_url": team2_logo,
            "status": _STATUS_MAP.get((raw.get("status") or "").lower(), Match.Status.UPCOMING),
            "winner_name": _extract_winner_name(raw),
        }

        scheduled_raw = raw.get("scheduled_at") or raw.get("begin_at")
        scheduled_at = parse_datetime(scheduled_raw) if scheduled_raw else None
        # scheduled_at is required (NOT NULL) with no model-level default; PandaScore
        # should always send one, but guard against a malformed payload breaking the sync.
        defaults["scheduled_at"] = scheduled_at or timezone.now()

        match, _created = Match.objects.update_or_create(
            pandascore_id=raw["id"], defaults=defaults
        )
        return match

    @transaction.atomic
    def _resolve_bets(self, match_id):
        """Pay out winners at stake*2, forfeit losers' stake, then lock the match.

        Runs inside one DB transaction per match so a cron run that overlaps
        with a slow previous run (or a second worker) can't double-pay bets:
        select_for_update() blocks the second resolver until the first commits,
        and it will then see bets_resolved=True and return immediately.
        """
        match = Match.objects.select_for_update().get(pk=match_id)
        if match.bets_resolved:
            return

        bets = Bet.objects.select_for_update().filter(match=match, status=Bet.Status.ACTIVE)
        now = timezone.now()
        for bet in bets:
            profile = Profile.objects.select_for_update().get(user_id=bet.user_id)
            won = bool(match.winner_name) and bet.chosen_team == match.winner_name

            if won:
                payout = bet.stake * 2
                profile.gg_balance += payout
                profile.wins += 1
                bet.status = Bet.Status.WON
                bet.payout = payout
            else:
                profile.losses += 1
                bet.status = Bet.Status.LOST
                bet.payout = 0

            profile.save(update_fields=["gg_balance", "wins", "losses"])
            bet.resolved_at = now
            bet.save(update_fields=["status", "payout", "resolved_at"])

        match.bets_resolved = True
        match.save(update_fields=["bets_resolved"])
