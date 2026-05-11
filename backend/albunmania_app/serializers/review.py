from rest_framework import serializers

from albunmania_app.models import REVIEW_TAGS, Review, ReviewReport


class ReviewCreateSerializer(serializers.Serializer):
    """Body for `POST /trades/{id}/reviews/`."""
    stars = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=500, allow_blank=True, required=False)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False, default=list, allow_empty=True,
    )

    def validate_tags(self, value):
        unknown = [t for t in value if t not in REVIEW_TAGS]
        if unknown:
            raise serializers.ValidationError(f'Unknown tags: {unknown}')
        return value


class ReviewEditSerializer(serializers.Serializer):
    """Body for `PATCH /reviews/{id}/` within the 24h window."""
    stars = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(max_length=500, allow_blank=True, required=False)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False, allow_empty=True,
    )

    def validate_tags(self, value):
        unknown = [t for t in value if t not in REVIEW_TAGS]
        if unknown:
            raise serializers.ValidationError(f'Unknown tags: {unknown}')
        return value


class ReviewReplySerializer(serializers.Serializer):
    reply = serializers.CharField(max_length=500)


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.EmailField(source='reviewer.email', read_only=True)
    reviewee_email = serializers.EmailField(source='reviewee.email', read_only=True)
    is_editable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'trade', 'reviewer', 'reviewer_email',
            'reviewee', 'reviewee_email',
            'stars', 'comment', 'tags',
            'reply', 'replied_at',
            'is_visible', 'is_editable',
            'created_at', 'updated_at',
        ]
        read_only_fields = (
            'id', 'trade', 'reviewer', 'reviewer_email',
            'reviewee', 'reviewee_email',
            'reply', 'replied_at', 'is_visible', 'is_editable',
            'created_at', 'updated_at',
        )


class ReviewReportCreateSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)


class ReviewReportSerializer(serializers.ModelSerializer):
    review_stars = serializers.IntegerField(source='review.stars', read_only=True)
    reporter_email = serializers.EmailField(source='reporter.email', read_only=True)

    class Meta:
        model = ReviewReport
        fields = [
            'id', 'review', 'review_stars',
            'reporter', 'reporter_email', 'reason',
            'status', 'resolved_by', 'resolved_at', 'resolution_notes',
            'created_at',
        ]
        read_only_fields = ('id', 'created_at', 'reporter')


class ReviewVisibilityToggleSerializer(serializers.Serializer):
    is_visible = serializers.BooleanField()
    resolution_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class RatingSummarySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_count = serializers.IntegerField()
    positive_pct = serializers.DecimalField(max_digits=5, decimal_places=2)
    distribution = serializers.DictField(child=serializers.IntegerField())
    top_tags = serializers.ListField(child=serializers.DictField())
