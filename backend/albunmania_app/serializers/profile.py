"""Profile + Onboarding serializers."""
from rest_framework import serializers

from albunmania_app.models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    """Public read serializer used by GET /profile/me/."""

    is_onboarded = serializers.BooleanField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'city',
            'avatar_url',
            'bio_short',
            'lat_approx',
            'lng_approx',
            'active_album_id',
            'whatsapp_optin',
            'push_optin',
            'browser_geo_optin',
            'whatsapp_e164',
            'rating_avg',
            'rating_count',
            'positive_pct',
            'is_onboarded',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'rating_avg', 'rating_count', 'positive_pct',
            'created_at', 'updated_at', 'is_onboarded',
        )


class MeSerializer(serializers.Serializer):
    """Composite GET /profile/me/ payload (user + profile)."""

    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.CharField()
    profile = ProfileSerializer()


class OnboardingSerializer(serializers.ModelSerializer):
    """Whitelist of fields the 3-step onboarding wizard can write."""

    # Active album is currently a placeholder int (FK to Album lands in Epic 2).
    active_album_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    # Lat/lng need to fit the Profile field constraints (DecimalField 9,6).
    lat_approx = serializers.DecimalField(
        max_digits=9, decimal_places=6,
        required=False, allow_null=True,
    )
    lng_approx = serializers.DecimalField(
        max_digits=9, decimal_places=6,
        required=False, allow_null=True,
    )

    # Basic E.164 sanity check (+ followed by 8-15 digits). Full validation
    # happens via libphonenumber on the frontend in a future iteration.
    whatsapp_e164 = serializers.RegexField(
        regex=r'^\+?\d{8,15}$',
        required=False, allow_blank=True,
    )

    class Meta:
        model = Profile
        fields = [
            'active_album_id',
            'city',
            'lat_approx',
            'lng_approx',
            'whatsapp_optin',
            'push_optin',
            'browser_geo_optin',
            'whatsapp_e164',
        ]

    def validate(self, attrs):
        # If the user opts in to WhatsApp they must provide a number.
        opting_in = attrs.get('whatsapp_optin', getattr(self.instance, 'whatsapp_optin', False))
        number = attrs.get('whatsapp_e164', getattr(self.instance, 'whatsapp_e164', ''))
        if opting_in and not number:
            raise serializers.ValidationError({
                'whatsapp_e164': 'A phone number in E.164 format is required when WhatsApp opt-in is true.',
            })
        return attrs
