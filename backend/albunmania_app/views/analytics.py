"""Admin analytics endpoints (Epic 13)."""
from __future__ import annotations

import csv
from datetime import datetime, timedelta
from io import StringIO

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.services.analytics_engine import (
    activity_heatmap,
    ad_kpis,
    community_kpis,
    device_breakdown,
    matches_trend,
    returning_vs_new,
    top_stickers_supply_demand,
)


def _is_admin_or_wm(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role in ('admin', 'web_manager')


def _parse_since(request, default_days: int = 30) -> datetime:
    raw = request.query_params.get('since')
    if raw:
        try:
            return datetime.fromisoformat(raw).replace(tzinfo=timezone.utc.utcoffset(None) and None) or datetime.fromisoformat(raw)
        except ValueError:
            pass
    return timezone.now() - timedelta(days=default_days)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """Composite endpoint for the admin landing — all KPI blocks in one shot."""
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    since = _parse_since(request)
    album_id = request.query_params.get('album_id')
    try:
        album_id = int(album_id) if album_id else None
    except ValueError:
        return Response({'error': 'invalid_album_id'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'community': community_kpis(since),
        'ads': ad_kpis(since),
        'returning_vs_new': returning_vs_new(since),
        'devices': device_breakdown(since),
        'top_stickers': top_stickers_supply_demand(album_id),
        'matches_trend': matches_trend(since),
        'heatmap': activity_heatmap(since),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_export_csv(request):
    """CSV export of community KPIs + ad KPIs + matches trend."""
    if not _is_admin_or_wm(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    since = _parse_since(request)
    community = community_kpis(since)
    ads = ad_kpis(since)
    trend = matches_trend(since)

    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(['# Albunmanía analytics export'])
    writer.writerow(['# window_since', community['window_since']])
    writer.writerow([])
    writer.writerow(['section', 'metric', 'value'])
    for k, v in community.items():
        if k == 'window_since':
            continue
        writer.writerow(['community', k, v])
    for k, v in ads.items():
        if k in ('window_since', 'top_cities'):
            continue
        writer.writerow(['ads', k, v])
    writer.writerow([])
    writer.writerow(['day', 'matches', 'trades'])
    for row in trend:
        writer.writerow([row['day'], row['matches'], row['trades']])

    response = HttpResponse(buf.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="albunmania-analytics.csv"'
    return response
