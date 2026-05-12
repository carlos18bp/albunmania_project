"""General moderation reports — report a user or a trade + admin queue."""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Report, Trade, User
from albunmania_app.serializers.report import (
    ReportCreateSerializer,
    ReportResolveSerializer,
    ReportSerializer,
)


def _is_admin(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role == 'admin'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_create(request):
    """Authenticated user reports a profile or a trade.

    Body: `{target_kind: 'user'|'trade', target_id, reason, detail?}`.
    A user can't report themselves; a trade can only be reported by one
    of its participants.
    """
    serializer = ReportCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    kwargs: dict = {}
    if data['target_kind'] == Report.TargetKind.USER:
        if data['target_id'] == request.user.id:
            return Response({'error': 'cannot_report_self'}, status=status.HTTP_400_BAD_REQUEST)
        target_user = get_object_or_404(User, pk=data['target_id'])
        kwargs['target_user'] = target_user
    else:  # TRADE
        trade = get_object_or_404(Trade.objects.select_related('match'), pk=data['target_id'])
        if request.user.id not in trade.participant_ids:
            return Response({'error': 'not_a_trade_participant'}, status=status.HTTP_403_FORBIDDEN)
        kwargs['target_trade'] = trade

    report = Report.objects.create(
        reporter=request.user,
        target_kind=data['target_kind'],
        reason=data['reason'],
        detail=data.get('detail', ''),
        **kwargs,
    )
    return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_report_list(request):
    """Admin moderation queue. Query params: status, kind."""
    if not _is_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    qs = Report.objects.select_related('reporter', 'resolved_by').all()
    status_filter = request.query_params.get('status')
    if status_filter in dict(Report.Status.choices):
        qs = qs.filter(status=status_filter)
    kind_filter = request.query_params.get('kind')
    if kind_filter in dict(Report.TargetKind.choices):
        qs = qs.filter(target_kind=kind_filter)

    return Response({'results': ReportSerializer(qs[:200], many=True).data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_report_resolve(request, report_id: int):
    """Admin resolves a report — `{status: 'dismissed'|'actioned', resolution_notes?}`."""
    if not _is_admin(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    report = get_object_or_404(Report, pk=report_id)
    serializer = ReportResolveSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    report.status = serializer.validated_data['status']
    report.resolution_notes = serializer.validated_data.get('resolution_notes', '')
    report.resolved_by = request.user
    report.resolved_at = timezone.now()
    report.save(update_fields=['status', 'resolution_notes', 'resolved_by', 'resolved_at'])
    return Response(ReportSerializer(report).data)
