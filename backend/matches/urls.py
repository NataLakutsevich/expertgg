from django.urls import path

from .views import BetCreateView, BetHistoryView, MatchListView

urlpatterns = [
    path("matches/", MatchListView.as_view(), name="matches-list"),
    path("bets/", BetCreateView.as_view(), name="bets-create"),
    path("bets/history/", BetHistoryView.as_view(), name="bets-history"),
]
