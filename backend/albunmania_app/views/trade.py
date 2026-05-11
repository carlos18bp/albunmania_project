"""Public trade endpoints — currently only the share lists view."""
from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from albunmania_app.models import Profile, Sticker, UserSticker
from albunmania_app.services.qr_token import verify_user_token


@api_view(['GET'])
@permission_classes([AllowAny])
def trade_share_lists(request, token: str):
    """Public view of a collector's available or wanted stickers.

    The QR/URL embeds a signed token plus a `kind` query parameter that
    discriminates the list rendered: `available` (count >= 2) for
    "what I have to trade" or `wanted` (count == 0) for "what I am
    looking for". The endpoint is unauthenticated — the token is the
    capability.
    """
    user_id = verify_user_token(token)
    if user_id is None:
        return Response({'error': 'invalid_or_expired_token'}, status=status.HTTP_400_BAD_REQUEST)

    kind = request.query_params.get('kind', 'available')
    if kind not in ('available', 'wanted'):
        return Response({'error': 'invalid_kind'}, status=status.HTTP_400_BAD_REQUEST)

    profile = Profile.objects.select_related('user').filter(user_id=user_id).first()
    if not profile:
        return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

    if kind == 'available':
        qs = UserSticker.objects.filter(user_id=user_id, count__gte=2)
    else:
        qs = UserSticker.objects.filter(user_id=user_id, count=0)

    if profile.active_album_id:
        qs = qs.filter(sticker__album_id=profile.active_album_id)

    qs = qs.select_related('sticker')[:1000]

    items = [
        {
            'sticker_id': us.sticker_id,
            'number': us.sticker.number,
            'name': us.sticker.name,
            'team': us.sticker.team,
            'image_url': us.sticker.image_url,
            'is_special_edition': us.sticker.is_special_edition,
        }
        for us in qs
    ]

    return Response({
        'kind': kind,
        'collector': {
            'user_id': user_id,
            'city': profile.city,
            'avatar_url': profile.avatar_url,
        },
        'items': items,
        'count': len(items),
    })
