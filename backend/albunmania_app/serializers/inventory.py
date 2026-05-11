from rest_framework import serializers

from albunmania_app.models import UserSticker


class InventoryItemSerializer(serializers.ModelSerializer):
    """Compact inventory entry. The sticker FK is exposed by id only; the
    catalogue endpoint feeds the front-end with sticker metadata so we keep
    payloads thin for the very-frequent inventory sync calls.
    """

    is_pasted = serializers.BooleanField(read_only=True)
    is_repeated = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserSticker
        fields = ['id', 'sticker', 'count', 'is_pasted', 'is_repeated', 'updated_at']
        read_only_fields = ('id', 'is_pasted', 'is_repeated', 'updated_at')


class InventoryBulkItemSerializer(serializers.Serializer):
    sticker = serializers.IntegerField(min_value=1)
    count = serializers.IntegerField(min_value=0)


class InventoryBulkSyncSerializer(serializers.Serializer):
    """Payload of `POST /inventory/bulk/`: a list of (sticker, count) tuples.

    Used by the 0/1/2+ tap UX: the client batches taps locally for 2s and
    pushes them in one request. Last-write-wins; the server overwrites the
    count for each (user, sticker) pair.
    """

    items = InventoryBulkItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('items must be a non-empty list.')
        if len(value) > 500:
            raise serializers.ValidationError('Too many items in one batch (max 500).')
        return value
