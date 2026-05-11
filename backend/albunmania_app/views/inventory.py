"""User inventory endpoints (0/1/2+ tap UX)."""
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Album, Sticker, UserSticker
from albunmania_app.serializers.inventory import (
    InventoryBulkSyncSerializer,
    InventoryItemSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_list(request):
    """Return the user's inventory, optionally scoped to an album.

    Query params:
      album_slug — only return UserSticker rows for stickers in this album.
    """
    qs = UserSticker.objects.filter(user=request.user).select_related('sticker')

    album_slug = request.query_params.get('album_slug')
    if album_slug:
        qs = qs.filter(sticker__album__slug=album_slug)

    return Response(InventoryItemSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def inventory_bulk_sync(request):
    """Atomic bulk update of `(user, sticker, count)` rows.

    Used by the 0/1/2+ tap UX: the client batches taps locally for ~2s and
    pushes them in a single request. Last-write-wins.

    Body: {"items": [{"sticker": 123, "count": 2}, ...]}
    """
    serializer = InventoryBulkSyncSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    items = serializer.validated_data['items']

    sticker_ids = [item['sticker'] for item in items]
    known_ids = set(Sticker.objects.filter(id__in=sticker_ids).values_list('id', flat=True))

    written = 0
    with transaction.atomic():
        for entry in items:
            sticker_id = entry['sticker']
            if sticker_id not in known_ids:
                continue
            UserSticker.objects.update_or_create(
                user=request.user,
                sticker_id=sticker_id,
                defaults={'count': entry['count']},
            )
            written += 1

    return Response(
        {'written': written, 'skipped': len(items) - written},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def inventory_tap(request):
    """Single-sticker tap helper — increments count by 1.

    Body: {"sticker": 123}

    The tap UX maps to 0 → 1 → 2 → 3. Reaching higher counts is fine
    (repeated stickers). To reset to 0 the client posts a bulk sync with
    `count: 0` for that sticker, matching the long-press gesture.
    """
    sticker_id = request.data.get('sticker')
    if not isinstance(sticker_id, int) or sticker_id < 1:
        return Response({'error': 'sticker_id_required'}, status=status.HTTP_400_BAD_REQUEST)

    if not Sticker.objects.filter(id=sticker_id).exists():
        return Response({'error': 'sticker_not_found'}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        entry, _ = UserSticker.objects.select_for_update().get_or_create(
            user=request.user,
            sticker_id=sticker_id,
            defaults={'count': 0},
        )
        entry.count = entry.count + 1
        entry.save(update_fields=['count', 'updated_at'])

    return Response(InventoryItemSerializer(entry).data)
