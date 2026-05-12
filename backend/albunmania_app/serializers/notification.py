"""Notification serializer."""
from rest_framework import serializers

from albunmania_app.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)
    actor_email = serializers.CharField(source='actor.email', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            'id', 'kind', 'title', 'body', 'url',
            'actor', 'actor_email', 'match', 'review',
            'read_at', 'is_read', 'created_at',
        ]
        read_only_fields = fields
