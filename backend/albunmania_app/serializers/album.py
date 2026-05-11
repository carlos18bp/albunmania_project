from rest_framework import serializers

from albunmania_app.models import Album, Sticker


class AlbumListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['id', 'name', 'slug', 'edition_year', 'total_stickers', 'cover_image_url']


class AlbumDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = [
            'id', 'name', 'slug', 'edition_year', 'total_stickers',
            'is_active', 'launch_date', 'end_date', 'cover_image_url',
        ]


class StickerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sticker
        fields = [
            'id', 'album', 'number', 'name', 'team', 'image_url',
            'is_special_edition', 'special_tier', 'market_value_estimate',
        ]
        read_only_fields = ('id',)
