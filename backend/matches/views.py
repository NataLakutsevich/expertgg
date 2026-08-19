from django.db import IntegrityError, transaction
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile

from .models import Bet, Match
from .serializers import BetCreateSerializer, BetHistorySerializer, MatchSerializer


class MatchListView(generics.ListAPIView):
    """GET /api/matches/ — the Play screen's match list.

    Optional ?status=upcoming|running|finished filters; cancelled matches are
    never shown. Each match includes the requesting user's own bet, if any.
    """

    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Match.objects.exclude(status=Match.Status.CANCELLED).prefetch_related("bets")
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_serializer_context(self):
        return {"request": self.request}


class BetCreateView(APIView):
    """POST /api/bets/ — place a bet: {match, chosen_team, stake}.

    The stake is debited from the user's gg balance immediately (escrow model):
    a win later credits stake*2 (net +stake), a loss credits nothing back
    (the staked gg was already forfeited at bet time).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BetCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        stake = serializer.validated_data["stake"]

        try:
            with transaction.atomic():
                profile = Profile.objects.select_for_update().get(user=request.user)
                if stake > profile.gg_balance:
                    return Response(
                        {"stake": "Insufficient gg balance."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                profile.gg_balance -= stake
                profile.save(update_fields=["gg_balance"])
                bet = serializer.save(user=request.user)
        except IntegrityError:
            # Lost a race against another request placing the same active bet.
            return Response(
                {"match": "You already have an active bet on this match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(BetCreateSerializer(bet).data, status=status.HTTP_201_CREATED)


class BetHistoryView(generics.ListAPIView):
    """GET /api/bets/history/ — the History screen: active, won and lost bets.

    Active bets (still live/starting) sort first, earliest match start time
    first; resolved (won/lost) bets follow, most recently resolved first.
    """

    serializer_class = BetHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        bets = list(
            Bet.objects.filter(user=self.request.user).select_related("match")
        )

        def sort_key(bet):
            if bet.status == Bet.Status.ACTIVE:
                return (0, bet.match.scheduled_at)
            resolved = bet.resolved_at or bet.created_at
            return (1, -resolved.timestamp())

        bets.sort(key=sort_key)
        return bets
