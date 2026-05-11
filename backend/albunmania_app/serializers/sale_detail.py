from rest_framework import serializers

from albunmania_app.models import Sale
from albunmania_app.serializers.sale import SoldProductSerializer


class SaleDetailSerializer(serializers.ModelSerializer):
    sold_products = SoldProductSerializer(many=True)

    class Meta:
        model = Sale
        fields = '__all__'
