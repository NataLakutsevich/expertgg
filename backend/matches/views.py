from django.db.models import Q
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Match
from .serializers import MatchHistorySerializer, MatchSerializer


def _active_match_for(user):
    return (
        Match.objects.filter(Q(player1=user) | Q(player2=user))
        .exclude(status=Match.Status.FINISHED)
        .order_by("-created_at")
        .first()
    )


class CurrentMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        match = _active_match_for(request.user)
        if match is None:
            # DRF's Response(None) renders an empty body instead of a JSON
            # `null`, so use JsonResponse to match the documented contract.
            return JsonResponse(None, safe=False)
        return Response(MatchSerializer(match).data)


class MatchSearchView(APIView):
    """POST starts/joins a search, DELETE cancels a pending search."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_staff or user.is_superuser:
            return Response(
                {"detail": "Staff and superuser accounts cannot join matchmaking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        existing = _active_match_for(user)
        if existing is not None:
            return Response(MatchSerializer(existing).data, status=status.HTTP_200_OK)

        waiting = (
            Match.objects.filter(status=Match.Status.SEARCHING, player2__isnull=True)
            .exclude(player1=user)
            .order_by("created_at")
            .first()
        )
        if waiting is not None:
            waiting.player2 = user
            waiting.status = Match.Status.ACTIVE
            waiting.save(update_fields=["player2", "status"])
            return Response(MatchSerializer(waiting).data, status=status.HTTP_200_OK)

        match = Match.objects.create(player1=user, status=Match.Status.SEARCHING)
        return Response(MatchSerializer(match).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        deleted, _ = Match.objects.filter(
            player1=request.user,
            status=Match.Status.SEARCHING,
            player2__isnull=True,
        ).delete()
        if not deleted:
            return Response(
                {"detail": "No pending search to cancel."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchHistoryView(generics.ListAPIView):
    serializer_class = MatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Match.objects.filter(
            Q(player1=user) | Q(player2=user), status=Match.Status.FINISHED
        ).order_by("-finished_at")
