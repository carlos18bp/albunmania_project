from rest_framework import serializers

from albunmania_app.models import MerchantProfile, MerchantSubscriptionPayment


class MerchantPublicSerializer(serializers.ModelSerializer):
    """Public surface of a merchant: what shows on the map."""

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    is_listing_visible = serializers.BooleanField(read_only=True)

    class Meta:
        model = MerchantProfile
        fields = [
            'user_id', 'business_name', 'business_type', 'address',
            'lat', 'lng', 'opening_hours', 'is_listing_visible',
        ]


class MerchantDashboardSerializer(serializers.ModelSerializer):
    """Self-update payload for the merchant dashboard.

    `subscription_status` and `subscription_expires_at` are intentionally
    read-only — the merchant cannot promote themselves; only the Web
    Manager via `register_payment`.
    """

    class Meta:
        model = MerchantProfile
        fields = [
            'business_name', 'business_type', 'address',
            'lat', 'lng', 'opening_hours', 'declared_stock',
            'subscription_status', 'subscription_expires_at',
        ]
        read_only_fields = ('subscription_status', 'subscription_expires_at')


class MerchantPaymentRegisterSerializer(serializers.Serializer):
    amount_cop = serializers.DecimalField(max_digits=12, decimal_places=2)
    period_months = serializers.IntegerField(min_value=1, max_value=24)
    method = serializers.CharField(max_length=40)
    reference = serializers.CharField(max_length=120, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class MerchantPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantSubscriptionPayment
        fields = [
            'id', 'amount_cop', 'period_months', 'method',
            'reference', 'notes', 'paid_at', 'created_at',
        ]
        read_only_fields = ('id', 'created_at')
