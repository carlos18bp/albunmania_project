"""Profile + onboarding views."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.serializers.profile import (
    MeSerializer,
    OnboardingSerializer,
    ProfileSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_me(request):
    """Return the current user + profile.

    The profile is created automatically by the post_save signal on User,
    so it always exists for an authenticated request.
    """
    user = request.user
    profile = user.profile
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
