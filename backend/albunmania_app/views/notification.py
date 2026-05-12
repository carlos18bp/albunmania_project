"""In-app notification center endpoints."""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Notification
from albunmania_app.serializers.notification import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """List the current user's notifications (newest first).

    Query params: unread=true (only unread), page=1, page_size=20 (max 100).
    """
    qs = Notification.objects.filter(user=request.user).select_related('actor')
    if request.query_params.get('unread') in ('true', '1', 'yes'):
        qs = qs.filter(read_at__isnull=True)

    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = max(1, min(int(request.query_params.get('page_size', 20)), 100))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_pagination'}, status=status.HTTP_400_BAD_REQUEST)

    total = qs.count()
    items = qs[(page - 1) * page_size: page * page_size]
    return Response({
        'results': NotificationSerializer(items, many=True).data,
        'page': page, 'page_size': page_size, 'total': total,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_unread_count(request):
    """`{count: N}` — for the Header bell badge."""
    count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, notification_id: int):
    """Mark a single notification as read (idempotent)."""
    notification = get_object_or_404(Notification, pk=notification_id, user=request.user)
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=['read_at'])
    return Response(NotificationSerializer(notification).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    """Mark all of the current user's unread notifications as read."""
    updated = Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
    return Response({'marked_read': updated})
