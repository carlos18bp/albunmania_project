from rest_framework import serializers

from albunmania_app.models import Sale


class SaleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ('id', 'email', 'city', 'state', 'postal_code')
