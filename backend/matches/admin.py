from django.contrib import admin

from .models import Bet, Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "team1_name",
        "team2_name",
        "videogame",
        "tournament_name",
        "status",
        "scheduled_at",
        "winner_name",
        "bets_resolved",
    )
    list_filter = ("status", "videogame", "bets_resolved")
    search_fields = ("team1_name", "team2_name", "tournament_name", "pandascore_id")
    date_hierarchy = "scheduled_at"


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "match",
        "chosen_team",
        "stake",
        "status",
        "payout",
        "created_at",
        "resolved_at",
    )
    list_filter = ("status",)
    search_fields = ("user__email", "user__username", "chosen_team")
    autocomplete_fields = ("user", "match")
    date_hierarchy = "created_at"
