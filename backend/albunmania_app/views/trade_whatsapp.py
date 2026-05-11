"""Trade WhatsApp opt-in + deep link endpoints (Epic 4)."""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import Trade, TradeWhatsAppOptIn
from albunmania_app.services.whatsapp_link import build_whatsapp_link


def _trade_for_user(trade_id: int, user) -> Trade:
    trade = get_object_or_404(Trade.objects.select_related('match'), pk=trade_id)
    if user.id not in trade.participant_ids:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied()
    return trade


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trade_whatsapp_optin(request, trade_id: int):
    """Toggle the caller's WhatsApp opt-in for a single trade.

    Body: `{"opted_in": true|false}` (defaults to True).
    """
    trade = _trade_for_user(trade_id, request.user)
    opted_in = bool(request.data.get('opted_in', True))

    optin, _ = TradeWhatsAppOptIn.objects.update_or_create(
        trade=trade, user=request.user,
        defaults={'opted_in': opted_in},
    )

    both_opted = TradeWhatsAppOptIn.objects.filter(
        trade=trade, opted_in=True,
    ).count() == 2

    return Response({
        'opted_in': optin.opted_in,
        'both_opted_in': both_opted,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trade_whatsapp_link(request, trade_id: int):
    """Return the wa.me deep link if BOTH participants have opted in.

    Otherwise returns 403 with the reason. We never leak the peer's
    phone number until both sides agree.
    """
    trade = _trade_for_user(trade_id, request.user)

    optins = list(
        TradeWhatsAppOptIn.objects.filter(trade=trade, opted_in=True)
        .values_list('user_id', flat=True)
    )
    if len(set(optins)) < 2:
        return Response(
            {'error': 'both_must_opt_in'},
            status=status.HTTP_403_FORBIDDEN,
        )

    link = build_whatsapp_link(trade, viewer_id=request.user.id)
    if not link:
        return Response(
            {'error': 'peer_has_no_whatsapp_number'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response({'wa_link': link})
