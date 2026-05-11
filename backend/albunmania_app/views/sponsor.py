"""Presenting Sponsor endpoints (public read + admin CRUD)."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Sponsor
from albunmania_app.serializers.sponsor import SponsorAdminSerializer, SponsorPublicSerializer


def _is_web_manager_or_admin(user) -> bool:
    return user.is_authenticated and user.role in ('web_manager', 'admin')


@api_view(['GET'])
@permission_classes([AllowAny])
def sponsor_active(request):
    """Return the sponsor whose window contains now(), or null.

    Used by the splash screen and the persistent header band. Cacheable
    upstream — caller should expect 1-minute staleness.
    """
    sponsor = Sponsor.active()
    if sponsor is None:
        return Response({'active': None})
    return Response({'active': SponsorPublicSerializer(sponsor).data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sponsor_admin_collection(request):
    """List and create sponsors (Web Manager / Admin)."""
    if not _is_web_manager_or_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        sponsors = Sponsor.objects.all()
        return Response(SponsorAdminSerializer(sponsors, many=True).data)

    serializer = SponsorAdminSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def sponsor_admin_detail(request, sponsor_id: int):
    if not _is_web_manager_or_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    try:
        sponsor = Sponsor.objects.get(id=sponsor_id)
    except Sponsor.DoesNotExist:
        return Response({'error': 'not_found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SponsorAdminSerializer(sponsor).data)

    if request.method == 'PATCH':
        serializer = SponsorAdminSerializer(sponsor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    sponsor.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
