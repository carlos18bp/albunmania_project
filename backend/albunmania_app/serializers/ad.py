from rest_framework import serializers

from albunmania_app.models import AdCampaign, AdCreative, AdImpression


class AdCreativePublicSerializer(serializers.ModelSerializer):
    """Lean payload returned to the player when serving a banner."""

    campaign_advertiser = serializers.CharField(source='campaign.advertiser_name', read_only=True)

    class Meta:
        model = AdCreative
        fields = ['id', 'image_url', 'headline', 'body', 'campaign_advertiser']


class AdServeResponseSerializer(serializers.Serializer):
    creative = AdCreativePublicSerializer()
    impression_id = serializers.IntegerField()


class AdCreativeAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCreative
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class AdCampaignAdminSerializer(serializers.ModelSerializer):
    creatives = AdCreativeAdminSerializer(many=True, read_only=True)
    remaining_impressions = serializers.IntegerField(read_only=True)

    class Meta:
        model = AdCampaign
        fields = [
            'id', 'advertiser_name', 'impressions_purchased', 'impressions_served',
            'remaining_impressions', 'cpm_rate_cop', 'geo_targeting_cities',
            'weight', 'start_date', 'end_date', 'status',
            'created_at', 'updated_at', 'creatives',
        ]
        read_only_fields = (
            'id', 'impressions_served', 'remaining_impressions',
            'created_at', 'updated_at', 'creatives',
        )


class AdImpressionStatsSerializer(serializers.Serializer):
    creative_id = serializers.IntegerField()
    impressions = serializers.IntegerField()
    clicks = serializers.IntegerField()
    ctr = serializers.FloatField()
