from django.conf import settings
from django.db import models


class Match(models.Model):
    class Status(models.TextChoices):
        SEARCHING = "searching", "Searching"
        ACTIVE = "active", "Active"
        FINISHED = "finished", "Finished"

    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="matches_as_player1",
        on_delete=models.CASCADE,
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="matches_as_player2",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.SEARCHING
    )
    score1 = models.PositiveIntegerField(default=0)
    score2 = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Match #{self.pk} ({self.status})"

    def opponent_of(self, user):
        if self.player1_id == user.id:
            return self.player2
        return self.player1

    def score_for(self, user):
        return self.score1 if self.player1_id == user.id else self.score2

    def opponent_score_for(self, user):
        return self.score2 if self.player1_id == user.id else self.score1
