from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        return Response(
            {
                "username": user.username,
                "email": user.email,
                "avatar": profile.avatar.url if profile.avatar else None,
                "gg_balance": profile.gg_balance,
                "wins": profile.wins,
                "losses": profile.losses,
            }
        )


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            Profile.objects.select_related("user")
            .filter(user__is_staff=False, user__is_superuser=False)
            .order_by("-gg_balance", "user__username")
        )

        limit = request.query_params.get("limit")
        if limit is not None:
            try:
                queryset = queryset[: max(int(limit), 0)]
            except ValueError:
                pass

        data = [
            {
                "rank": index + 1,
                "username": profile.user.username,
                "avatar": profile.avatar.url if profile.avatar else None,
                "gg": profile.gg_balance,
                "is_current_user": profile.user_id == request.user.id,
            }
            for index, profile in enumerate(queryset)
        ]
        return Response(data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or already blacklisted token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)
