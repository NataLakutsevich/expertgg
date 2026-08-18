from django.conf import settings
from django.db import models


class Match(models.Model):
    """A real esports match fed in from PandaScore; users bet on the winner."""

    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        RUNNING = "running", "Running"
        FINISHED = "finished", "Finished"
        CANCELLED = "cancelled", "Cancelled"

    pandascore_id = models.BigIntegerField(unique=True)
    tournament_name = models.CharField(max_length=255)
    videogame = models.CharField(max_length=100)  # "Counter-Strike", "League of Legends", ...
    team1_name = models.CharField(max_length=100)
    team1_logo_url = models.URLField(blank=True)
    team2_name = models.CharField(max_length=100)
    team2_logo_url = models.URLField(blank=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING)
    winner_name = models.CharField(max_length=100, blank=True, null=True)
    bets_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.team1_name} vs {self.team2_name} ({self.status})"


class Bet(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bets"
    )
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="bets")
    chosen_team = models.CharField(max_length=100)  # team1_name or team2_name at bet time
    stake = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    payout = models.PositiveIntegerField(default=0)  # 0 until resolved; stake*2 on a win
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "match"],
                condition=models.Q(status="active"),
                name="one_active_bet_per_match",
            )
        ]

    def __str__(self):
        return f"{self.user} bet {self.stake} on {self.chosen_team} ({self.status})"
