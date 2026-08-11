from rest_framework import serializers

from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = [
            "id",
            "player1",
            "player2",
            "status",
            "score1",
            "score2",
            "created_at",
            "finished_at",
        ]


class MatchHistorySerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source="finished_at")

    class Meta:
        model = Match
        fields = ["id", "opponent", "result", "score", "date"]

    def get_opponent(self, obj):
        user = self.context["request"].user
        opponent = obj.opponent_of(user)
        return opponent.username if opponent else None

    def get_result(self, obj):
        user = self.context["request"].user
        mine, theirs = obj.score_for(user), obj.opponent_score_for(user)
        if mine > theirs:
            return "win"
        if mine < theirs:
            return "loss"
        return "draw"

    def get_score(self, obj):
        user = self.context["request"].user
        return f"{obj.score_for(user)}:{obj.opponent_score_for(user)}"
