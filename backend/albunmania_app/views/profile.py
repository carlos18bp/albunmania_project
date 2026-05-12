"""Profile + onboarding views."""
from decimal import Decimal

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Album, Profile, Trade, UserSticker
from albunmania_app.serializers.profile import (
    AccountSettingsSerializer,
    MeSerializer,
    OnboardingSerializer,
    ProfileSerializer,
    PublicProfileSerializer,
)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_me(request):
    """GET: the current user + profile.  PATCH: update account settings.

    The profile is created automatically by the post_save signal on User,
    so it always exists for an authenticated request. PATCH writes only
    the fields whitelisted by `AccountSettingsSerializer`; the name comes
    from Google and is not editable here.
    """
    user = request.user
    profile = user.profile

    if request.method == 'PATCH':
        serializer = AccountSettingsSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    payload = {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'profile': ProfileSerializer(profile).data,
    }
    return Response(MeSerializer(payload).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def profile_onboarding(request):
    """Persist the 3-step onboarding wizard state.

    Idempotent: the wizard can be replayed any number of times. Each call
    PATCHes the Profile with whatever fields the client sends.
    """
    profile = request.user.profile
    serializer = OnboardingSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(
        {
            'profile': ProfileSerializer(profile).data,
            'is_onboarded': profile.is_onboarded,
        },
        status=status.HTTP_200_OK,
    )


def _album_completion_pct(user_id: int, album_id) -> Decimal:
    """% of the user's active album that is pasted (UserSticker.count >= 1)."""
    if not album_id:
        return Decimal('0')
    album = Album.objects.filter(id=album_id).first()
    total = album.total_stickers if album else 0
    if not total:
        return Decimal('0')
    owned = UserSticker.objects.filter(
        user_id=user_id, sticker__album_id=album_id, count__gte=1,
    ).count()
    pct = (Decimal(owned) / Decimal(total)) * Decimal('100')
    return pct.quantize(Decimal('0.01'))


@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile(request, user_id: int):
    """Public collector profile — name/city/avatar/bio + reputation +
    album completion % + completed-trade count. No email, no phone.
    """
    profile = Profile.objects.select_related('user').filter(user_id=user_id).first()
    if not profile:
        return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

    user = profile.user
    display_name = (f'{user.first_name} {user.last_name}').strip() or user.email.split('@')[0]
    trades_completed = (
        Trade.objects.filter(status=Trade.Status.COMPLETED)
        .filter(Q(match__user_a_id=user_id) | Q(match__user_b_id=user_id))
        .count()
    )

    return Response(PublicProfileSerializer({
        'user_id': user_id,
        'display_name': display_name,
        'city': profile.city,
        'avatar_url': profile.avatar_url,
        'bio_short': profile.bio_short,
        'rating_avg': profile.rating_avg,
        'rating_count': profile.rating_count,
        'positive_pct': profile.positive_pct,
        'album_completion_pct': _album_completion_pct(user_id, profile.active_album_id),
        'trades_completed_count': trades_completed,
    }).data)
