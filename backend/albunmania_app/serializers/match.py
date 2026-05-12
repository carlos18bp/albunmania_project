from rest_framework import serializers

from albunmania_app.models import Like, Match, Trade


class ProfilePreviewSerializer(serializers.Serializer):
    """Public surface of a Profile rendered inside swipe and match cards."""
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    city = serializers.CharField(allow_blank=True)
    avatar_url = serializers.URLField(allow_blank=True)
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_count = serializers.IntegerField()
    is_online = serializers.BooleanField(required=False, default=False)


class MatchCandidateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    distance_km = serializers.FloatField()
    stickers_offered = serializers.ListField(child=serializers.IntegerField())
    stickers_wanted = serializers.ListField(child=serializers.IntegerField())
    profile_preview = ProfilePreviewSerializer()


class LikeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['to_user', 'sticker_offered', 'sticker_wanted']

    def validate(self, attrs):
        from_user = self.context['request'].user
        if attrs['to_user'] == from_user:
            raise serializers.ValidationError('Cannot like yourself.')
        return attrs


class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = ['id', 'items', 'status', 'created_at', 'updated_at']
        read_only_fields = ('id', 'created_at', 'updated_at')


class MatchListSerializer(serializers.ModelSerializer):
    other_user_id = serializers.SerializerMethodField()
    trade = TradeSerializer(read_only=True)

    class Meta:
        model = Match
        fields = [
            'id', 'channel', 'status', 'created_at', 'last_event_at',
            'other_user_id', 'trade',
        ]

    def get_other_user_id(self, obj: Match) -> int:
        me = self.context['request'].user.id
        return obj.user_b_id if obj.user_a_id == me else obj.user_a_id


class MatchDetailSerializer(MatchListSerializer):
    pass


class QRTokenSerializer(serializers.Serializer):
    token = serializers.CharField()
    expires_at = serializers.IntegerField()


class QRScanSerializer(serializers.Serializer):
    token = serializers.CharField()


class QRConfirmItemSerializer(serializers.Serializer):
    from_user = serializers.IntegerField()
    to_user = serializers.IntegerField()
    sticker_id = serializers.IntegerField()


class QRConfirmSerializer(serializers.Serializer):
    other_user = serializers.IntegerField()
    items = QRConfirmItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('items must be a non-empty list.')
        if len(value) > 200:
            raise serializers.ValidationError('Too many items in one trade (max 200).')
        return value
