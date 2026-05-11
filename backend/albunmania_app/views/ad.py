"""Ad endpoints — public banner serving + click redirect + admin CRUD."""
from __future__ import annotations

from django.db.models import Count, Q
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import AdCampaign, AdClick, AdImpression
from albunmania_app.serializers.ad import (
    AdCampaignAdminSerializer,
    AdCreativePublicSerializer,
    AdImpressionStatsSerializer,
    AdServeResponseSerializer,
)
from albunmania_app.services.ad_engine import serve_banner


def _is_web_manager(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role in ('web_manager', 'admin')


@api_view(['GET'])
@permission_classes([AllowAny])
def ads_serve(request):
    """Serve a banner for `?slot=home|feed&city=Bogot%C3%A1`.

    Returns `{creative, impression_id}` or 204 No Content if no
    eligible campaign.
    """
    slot = request.query_params.get('slot') or ''
    if slot not in ('home', 'feed'):
        return Response({'error': 'invalid_slot'}, status=status.HTTP_400_BAD_REQUEST)
    city = (request.query_params.get('city') or '').strip()

    result = serve_banner(slot=slot, city=city, user=request.user if request.user.is_authenticated else None)
    if result is None:
        return Response(status=status.HTTP_204_NO_CONTENT)

    creative, impression = result
    return Response(AdServeResponseSerializer({
        'creative': AdCreativePublicSerializer(creative).data,
        'impression_id': impression.id,
    }).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def ads_click(request, impression_id: int):
    """Record the click and 302 to the creative's `click_url`."""
    impression = get_object_or_404(AdImpression.objects.select_related('creative'), pk=impression_id)
    AdClick.objects.create(impression=impression)
    return HttpResponseRedirect(impression.creative.click_url)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ad_admin_campaigns(request):
    """List/create campaigns (Web Manager only)."""
    if not _is_web_manager(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        campaigns = AdCampaign.objects.prefetch_related('creatives').order_by('-created_at')[:200]
        return Response({'results': AdCampaignAdminSerializer(campaigns, many=True).data})

    serializer = AdCampaignAdminSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(created_by=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def ad_admin_campaign_detail(request, campaign_id: int):
    if not _is_web_manager(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    campaign = get_object_or_404(AdCampaign, pk=campaign_id)
    if request.method == 'GET':
        return Response(AdCampaignAdminSerializer(campaign).data)
    if request.method == 'DELETE':
        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = AdCampaignAdminSerializer(campaign, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ad_admin_stats(request, campaign_id: int):
    """Per-creative impressions + clicks + CTR for a campaign."""
    if not _is_web_manager(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    campaign = get_object_or_404(AdCampaign, pk=campaign_id)
    rows = []
    for creative in campaign.creatives.all():
        impressions = creative.impressions.count()
        clicks = AdClick.objects.filter(impression__creative=creative).count()
        ctr = (clicks / impressions) if impressions else 0.0
        rows.append({
            'creative_id': creative.id,
            'impressions': impressions,
            'clicks': clicks,
            'ctr': round(ctr, 4),
        })
    return Response({'results': AdImpressionStatsSerializer(rows, many=True).data})
