"""Collector discovery serializers (map + predictive search)."""
from rest_framework import serializers


class CollectorMapEntrySerializer(serializers.Serializer):
    """A collector pin on the "Mapa de Coleccionistas" — approximate location only."""
    user_id = serializers.IntegerField()
    display_name = serializers.CharField()
    city = serializers.CharField(allow_blank=True)
    avatar_url = serializers.CharField(allow_blank=True)
    lat_approx = serializers.DecimalField(max_digits=9, decimal_places=6)
    lng_approx = serializers.DecimalField(max_digits=9, decimal_places=6)
    rating_avg = serializers.DecimalField(max_digits=3, decimal_places=2)
    rating_count = serializers.IntegerField()
    is_online = serializers.BooleanField()


class CollectorSearchResultSerializer(serializers.Serializer):
    """A collector suggestion in the catalogue search dropdown."""
    user_id = serializers.IntegerField()
    display_name = serializers.CharField()
    city = serializers.CharField(allow_blank=True)
    avatar_url = serializers.CharField(allow_blank=True)
