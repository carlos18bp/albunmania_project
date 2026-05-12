"""Push subscription endpoints."""
from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import PushSubscription


@api_view(['GET'])
@permission_classes([AllowAny])
def push_public_key(request):
    """Expose the VAPID public key the browser needs to subscribe."""
    return Response({'public_key': getattr(settings, 'VAPID_PUBLIC_KEY', '')})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_subscribe(request):
    """Persist (or refresh) a PushSubscription for the caller.

    Body shape mirrors the browser PushSubscription `toJSON()`:
      `{endpoint, keys: {p256dh, auth}}`
    """
    data = request.data or {}
    endpoint = data.get('endpoint')
    keys = data.get('keys') or {}
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not endpoint or not p256dh or not auth:
        return Response({'error': 'invalid_subscription'}, status=status.HTTP_400_BAD_REQUEST)

    user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'user': request.user,
            'p256dh': p256dh,
            'auth': auth,
            'user_agent': user_agent,
        },
    )
    return Response(
        {'id': sub.id, 'created': created},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def push_unsubscribe(request):
    """Remove a PushSubscription by endpoint (caller's only)."""
    endpoint = (request.data or {}).get('endpoint')
    if not endpoint:
        return Response({'error': 'endpoint_required'}, status=status.HTTP_400_BAD_REQUEST)

    deleted, _ = PushSubscription.objects.filter(
        user=request.user, endpoint=endpoint,
    ).delete()
    return Response({'deleted': deleted})
