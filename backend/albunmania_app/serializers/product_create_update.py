from rest_framework import serializers

from albunmania_app.models import Product


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('title', 'category', 'sub_category', 'description', 'price', 'gallery')
