from django.urls import path

from .views import CurrentMatchView, MatchHistoryView, MatchSearchView

urlpatterns = [
    path("matches/current/", CurrentMatchView.as_view(), name="matches-current"),
    path("matches/search/", MatchSearchView.as_view(), name="matches-search"),
    path("matches/history/", MatchHistoryView.as_view(), name="matches-history"),
]
