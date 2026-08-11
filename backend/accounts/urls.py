from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import LeaderboardView, LogoutView, MeView

urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("account/me/", MeView.as_view(), name="account-me"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
