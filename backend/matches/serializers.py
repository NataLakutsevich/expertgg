from rest_framework import serializers

from .models import Bet, Match


class MatchSerializer(serializers.ModelSerializer):
    """Full match info for the Play list, including the requesting user's own bet (if any)."""

    user_bet = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = (
            "id",
            "tournament_name",
            "videogame",
            "team1_name",
            "team1_logo_url",
            "team2_name",
            "team2_logo_url",
            "scheduled_at",
            "status",
            "winner_name",
            "user_bet",
        )

    def get_user_bet(self, match):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None

        # get_queryset() prefetches "bets" for the whole list, so filter in Python
        # there to avoid a query per row; fall back to a direct query otherwise
        # (e.g. when this serializer is used for a single already-fetched instance).
        if hasattr(match, "_prefetched_objects_cache") and "bets" in match._prefetched_objects_cache:
            bet = next((b for b in match.bets.all() if b.user_id == request.user.id), None)
        else:
            bet = match.bets.filter(user=request.user).first()

        if bet is None:
            return None
        return {
            "id": bet.id,
            "chosen_team": bet.chosen_team,
            "stake": bet.stake,
            "status": bet.status,
            "payout": bet.payout,
        }


class BetCreateSerializer(serializers.ModelSerializer):
    """Validates and creates a new bet. The actual gg debit happens in the view,
    inside a transaction, so it can safely lock the user's Profile row first."""

    # Exposed as "match_id" in the request/response body to match docs/requirements_simplified2.md §4;
    # `source="match"` means validated_data/instance still use the normal `match` FK internally.
    match_id = serializers.PrimaryKeyRelatedField(
        source="match", queryset=Match.objects.all()
    )

    class Meta:
        model = Bet
        fields = ("id", "match_id", "chosen_team", "stake", "status", "payout", "created_at")
        read_only_fields = ("id", "status", "payout", "created_at")

    def validate_stake(self, value):
        if value <= 0:
            raise serializers.ValidationError("Stake must be a positive number of gg.")
        return value

    def validate(self, attrs):
        match = attrs["match"]
        chosen_team = attrs["chosen_team"]

        if match.status != Match.Status.UPCOMING:
            raise serializers.ValidationError(
                {"match": "Betting is only open before the match starts."}
            )
        if chosen_team not in (match.team1_name, match.team2_name):
            raise serializers.ValidationError(
                {"chosen_team": "chosen_team must be one of the two teams in this match."}
            )

        request = self.context["request"]
        if Bet.objects.filter(user=request.user, match=match, status=Bet.Status.ACTIVE).exists():
            raise serializers.ValidationError(
                {"match": "You already have an active bet on this match."}
            )

        # Soft check here for a fast validation error; the view re-checks the
        # balance again under a row lock right before the actual debit.
        profile = request.user.profile
        if attrs["stake"] > profile.gg_balance:
            raise serializers.ValidationError({"stake": "Insufficient gg balance."})

        return attrs


class BetHistorySerializer(serializers.ModelSerializer):
    """Flattened match + bet info for the History screen's Win/Lose/Active cards."""

    team1_name = serializers.CharField(source="match.team1_name")
    team2_name = serializers.CharField(source="match.team2_name")
    videogame = serializers.CharField(source="match.videogame")
    tournament_name = serializers.CharField(source="match.tournament_name")
    winner_name = serializers.CharField(source="match.winner_name")
    # Distinct from the bet's own "status" (active/won/lost) — lets an active
    # bet's card show "Starting"/"Live" instead of a date it does not have yet.
    match_status = serializers.CharField(source="match.status")

    class Meta:
        model = Bet
        fields = (
            "id",
            "team1_name",
            "team2_name",
            "videogame",
            "tournament_name",
            "winner_name",
            "match_status",
            "chosen_team",
            "stake",
            "status",
            "payout",
            "created_at",
            "resolved_at",
        )
