from rest_framework import serializers

from albunmania_app.models import Sponsor


class SponsorPublicSerializer(serializers.ModelSerializer):
    """Public read serializer used by the splash/header.

    Intentionally excludes `contract_amount` — that field is operator-only.
    """

    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Sponsor
        fields = [
            'id', 'brand_name', 'logo_url',
            'primary_color', 'secondary_color', 'message_text',
            'active_from', 'active_until', 'is_currently_active',
        ]


class SponsorAdminSerializer(serializers.ModelSerializer):
    """Full sponsor representation for the Web Manager admin endpoints."""

    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Sponsor
        fields = [
            'id', 'brand_name', 'logo_url',
            'primary_color', 'secondary_color', 'message_text',
            'active_from', 'active_until', 'contract_amount',
            'is_currently_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'is_currently_active', 'created_at', 'updated_at')
