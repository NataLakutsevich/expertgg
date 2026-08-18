from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile

# Fixed mock reward for "watching an ad" — no real ad SDK integration, per
# docs/requirements_simplified2.md §1 step 7 ("это не требуется для задания").
GET_COINS_REWARD = 2  # gg per tap


def _serialize_profile(user):
    profile = user.profile
    return {
        "username": user.username,
        "email": user.email,
        "avatar": profile.avatar.url if profile.avatar else None,
        "gg_balance": profile.gg_balance,
        "wins": profile.wins,
        "losses": profile.losses,
    }


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        return Response(_serialize_profile(request.user))

    def patch(self, request):
        """Optional profile editing (docs/requirements_simplified2.md §1 step 8):
        multipart body with an optional `username` and/or `avatar` file."""
        user = request.user
        profile = user.profile

        username = request.data.get("username")
        if username:
            username = str(username).strip()
            if not username:
                return Response(
                    {"username": "Username cannot be blank."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.username = username
            user.save(update_fields=["username"])

        avatar = request.data.get("avatar")
        if avatar:
            profile.avatar = avatar
            profile.save(update_fields=["avatar"])

        return Response(_serialize_profile(user))


class GetCoinsView(APIView):
    """POST /api/account/get-coins/ — mock "watch an ad, get gg" reward."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        with transaction.atomic():
            profile = Profile.objects.select_for_update().get(user=request.user)
            profile.gg_balance = F("gg_balance") + GET_COINS_REWARD
            profile.save(update_fields=["gg_balance"])
            profile.refresh_from_db(fields=["gg_balance"])

        return Response({"gg_balance": profile.gg_balance, "reward": GET_COINS_REWARD})


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
