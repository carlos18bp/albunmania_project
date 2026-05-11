"""Match endpoints — swipe + QR presencial."""
from __future__ import annotations

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Like, Match, Profile, Trade, UserSticker
from albunmania_app.serializers.match import (
    LikeCreateSerializer,
    MatchCandidateSerializer,
    MatchDetailSerializer,
    MatchListSerializer,
    ProfilePreviewSerializer,
    QRConfirmSerializer,
    QRScanSerializer,
    QRTokenSerializer,
)
from albunmania_app.services.match_engine import find_candidates
from albunmania_app.services.qr_cross import compute_offline_cross
from albunmania_app.services.qr_token import sign_user_token, verify_user_token


def _profile_preview_payload(profile: Profile) -> dict:
    return {
        'user_id': profile.user_id,
        'email': profile.user.email,
        'city': profile.city,
        'avatar_url': profile.avatar_url,
        'rating_avg': profile.rating_avg,
        'rating_count': profile.rating_count,
    }


def _get_canonical_pair(a_id: int, b_id: int) -> tuple[int, int]:
    return Match.canonical_pair(a_id, b_id)


def _build_trade_items_from_likes(like_a: Like, like_b: Like) -> list[dict]:
    """Items for the swipe Trade: what each side gives the other.

    Inferred from the two mirror Likes: like_a says A offers
    sticker_offered (which == B's wanted), and so on.
    """
    return [
        {
            'from_user': like_a.from_user_id,
            'to_user': like_a.to_user_id,
            'sticker_id': like_a.sticker_offered_id,
        },
        {
            'from_user': like_b.from_user_id,
            'to_user': like_b.to_user_id,
            'sticker_id': like_b.sticker_offered_id,
        },
    ]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_feed(request):
    """Top-N candidates for the swipe view, scoped to the active album."""
    try:
        radius_km = float(request.query_params.get('radius_km', 10))
        limit = int(request.query_params.get('limit', 20))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_query'}, status=status.HTTP_400_BAD_REQUEST)

    radius_km = max(0.5, min(radius_km, 200.0))
    limit = max(1, min(limit, 50))

    candidates = find_candidates(request.user, radius_km=radius_km, limit=limit)
    if not candidates:
        return Response({'results': []})

    profiles_by_user = {
        p.user_id: p
        for p in Profile.objects.filter(user_id__in=[c.user_id for c in candidates]).select_related('user')
    }

    payload = []
    for cand in candidates:
        profile = profiles_by_user.get(cand.user_id)
        if not profile:
            continue
        payload.append({
            'user_id': cand.user_id,
            'distance_km': cand.distance_km,
            'stickers_offered': cand.stickers_offered,
            'stickers_wanted': cand.stickers_wanted,
            'profile_preview': _profile_preview_payload(profile),
        })

    return Response({'results': MatchCandidateSerializer(payload, many=True).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_like(request):
    """Persist a like; return mutual + trade if the mirror exists."""
    serializer = LikeCreateSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)

    with transaction.atomic():
        like, _created = Like.objects.get_or_create(
            from_user=request.user,
            to_user=serializer.validated_data['to_user'],
            sticker_offered=serializer.validated_data['sticker_offered'],
            sticker_wanted=serializer.validated_data['sticker_wanted'],
        )
        mirror = like.find_mirror()
        if not mirror:
            return Response({'mutual': False, 'like_id': like.id}, status=status.HTTP_201_CREATED)

        a_id, b_id = _get_canonical_pair(like.from_user_id, like.to_user_id)
        like_a = like if like.from_user_id == a_id else mirror
        like_b = mirror if like_a is like else like

        match, created = Match.objects.get_or_create(
            user_a_id=a_id, user_b_id=b_id, channel=Match.Channel.SWIPE,
            defaults={'status': Match.Status.MUTUAL},
        )
        trade, _ = Trade.objects.get_or_create(
            match=match,
            defaults={'items': _build_trade_items_from_likes(like_a, like_b)},
        )

    return Response(
        {'mutual': True, 'match_id': match.id, 'trade_id': trade.id, 'created': created},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_mine(request):
    """List the caller's matches, optionally filtered by status."""
    status_filter = request.query_params.get('status')
    qs = Match.objects.filter(
        models_or_me_filter(request.user.id)
    ).select_related('trade').order_by('-last_event_at')
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response({
        'results': MatchListSerializer(qs, many=True, context={'request': request}).data
    })


def models_or_me_filter(user_id: int):
    from django.db.models import Q
    return Q(user_a_id=user_id) | Q(user_b_id=user_id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_detail(request, match_id: int):
    match = get_object_or_404(
        Match.objects.select_related('trade').filter(models_or_me_filter(request.user.id)),
        pk=match_id,
    )
    return Response(MatchDetailSerializer(match, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def qr_me(request):
    token, expires_at = sign_user_token(request.user.id)
    return Response(QRTokenSerializer({'token': token, 'expires_at': expires_at}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def qr_scan(request):
    """Verify a scanned QR token, return the issuing user's preview."""
    serializer = QRScanSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = verify_user_token(serializer.validated_data['token'])
    if user_id is None:
        return Response({'error': 'invalid_or_expired_token'}, status=status.HTTP_400_BAD_REQUEST)
    if user_id == request.user.id:
        return Response({'error': 'cannot_scan_self'}, status=status.HTTP_400_BAD_REQUEST)

    profile = Profile.objects.select_related('user').filter(user_id=user_id).first()
    if not profile:
        return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'user_id': user_id,
        'profile_preview': ProfilePreviewSerializer(_profile_preview_payload(profile)).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def qr_confirm(request):
    """Persist a face-to-face match after sanity-checking the inventory cross."""
    serializer = QRConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    other_id = serializer.validated_data['other_user']
    items = serializer.validated_data['items']

    if other_id == request.user.id:
        return Response({'error': 'cannot_match_self'}, status=status.HTTP_400_BAD_REQUEST)

    # Sanity check: every item.from_user must currently own a repeated of the sticker
    # and item.to_user must currently be missing it. Reuses compute_offline_cross.
    me_inv = list(
        UserSticker.objects.filter(user_id=request.user.id).values('sticker_id', 'count')
    )
    other_inv = list(
        UserSticker.objects.filter(user_id=other_id).values('sticker_id', 'count')
    )
    me_inv_typed = [{'sticker_id': r['sticker_id'], 'count': r['count']} for r in me_inv]
    other_inv_typed = [{'sticker_id': r['sticker_id'], 'count': r['count']} for r in other_inv]

    cross = compute_offline_cross(me_inv_typed, other_inv_typed)
    valid_pairs = {
        (request.user.id, other_id, c['sticker_id']) for c in cross['a_to_b']
    } | {
        (other_id, request.user.id, c['sticker_id']) for c in cross['b_to_a']
    }

    for it in items:
        triple = (it['from_user'], it['to_user'], it['sticker_id'])
        if triple not in valid_pairs:
            return Response(
                {'error': 'invalid_item', 'item': it},
                status=status.HTTP_400_BAD_REQUEST,
            )

    a_id, b_id = _get_canonical_pair(request.user.id, other_id)
    with transaction.atomic():
        match, created = Match.objects.get_or_create(
            user_a_id=a_id, user_b_id=b_id, channel=Match.Channel.QR_PRESENCIAL,
            defaults={'status': Match.Status.CONFIRMED},
        )
        trade, _ = Trade.objects.get_or_create(
            match=match,
            defaults={'items': [dict(it) for it in items]},
        )

    return Response(
        {'match_id': match.id, 'trade_id': trade.id, 'created': created},
        status=status.HTTP_201_CREATED,
    )
