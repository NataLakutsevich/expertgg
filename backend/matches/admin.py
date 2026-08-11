from django.contrib import admin

from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "player1",
        "player2",
        "status",
        "score1",
        "score2",
        "created_at",
        "finished_at",
    )
    list_filter = ("status",)
    search_fields = (
        "player1__email",
        "player1__username",
        "player2__email",
        "player2__username",
    )
    autocomplete_fields = ("player1", "player2")
    date_hierarchy = "created_at"
