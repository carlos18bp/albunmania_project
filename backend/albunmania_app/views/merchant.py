"""Merchant endpoints — public listing, dashboard self-update, admin actions."""
from __future__ import annotations

import math
from decimal import Decimal

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.models import MerchantProfile, User
from albunmania_app.serializers.merchant import (
    MerchantDashboardSerializer,
    MerchantPaymentRegisterSerializer,
    MerchantPaymentSerializer,
    MerchantPublicSerializer,
)
from albunmania_app.services.match_engine import haversine_km
from albunmania_app.services.merchant_subscription import register_payment


def _is_web_manager(user) -> bool:
    role = getattr(user, 'role', None)
    return user.is_staff or role in ('web_manager', 'admin')


@api_view(['GET'])
@permission_classes([AllowAny])
def merchant_public_list(request):
    """Public list of active merchants, optionally filtered by city or geo radius.

    Query params:
      city — case-insensitive exact match
      lat, lng, radius_km — return only merchants within `radius_km` of point
      limit — max results (default 50, max 200)
    """
    qs = MerchantProfile.objects.filter(
        subscription_status='active',
        subscription_expires_at__gt=timezone.now(),
    ).select_related('user').exclude(lat__isnull=True).exclude(lng__isnull=True)

    city = (request.query_params.get('city') or '').strip()
    if city:
        qs = qs.filter(user__profile__city__iexact=city)

    try:
        limit = max(1, min(int(request.query_params.get('limit', 50)), 200))
    except (TypeError, ValueError):
        return Response({'error': 'invalid_limit'}, status=status.HTTP_400_BAD_REQUEST)

    lat_param = request.query_params.get('lat')
    lng_param = request.query_params.get('lng')
    radius_param = request.query_params.get('radius_km')

    results = list(qs[:limit * 4])  # over-fetch a bit so radius filter still hits limit
    if lat_param and lng_param and radius_param:
        try:
            lat = float(lat_param); lng = float(lng_param)
            radius_km = max(0.5, min(float(radius_param), 200.0))
        except (TypeError, ValueError):
            return Response({'error': 'invalid_geo_params'}, status=status.HTTP_400_BAD_REQUEST)
        results = [
            m for m in results
            if haversine_km(lat, lng, float(m.lat), float(m.lng)) <= radius_km
        ]

    return Response({
        'results': MerchantPublicSerializer(results[:limit], many=True).data,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def merchant_dashboard(request):
    """Merchant self-service: read or update own MerchantProfile."""
    profile = MerchantProfile.objects.filter(user=request.user).first()
    if not profile:
        return Response({'error': 'not_a_merchant'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        return Response(MerchantDashboardSerializer(profile).data)

    serializer = MerchantDashboardSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merchant_admin_promote(request, user_id: int):
    """Web Manager promotes a user to MERCHANT role and ensures profile."""
    if not _is_web_manager(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    target = get_object_or_404(User, pk=user_id)
    target.assign_role(User.Role.MERCHANT)
    MerchantProfile.objects.get_or_create(user=target)
    return Response({'user_id': target.id, 'role': target.role})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merchant_admin_register_payment(request, user_id: int):
    """Web Manager registers a manual subscription payment for a merchant."""
    if not _is_web_manager(request.user):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    serializer = MerchantPaymentRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    merchant = get_object_or_404(MerchantProfile, user_id=user_id)
    payment = register_payment(
        merchant=merchant,
        registered_by=request.user,
        amount_cop=serializer.validated_data['amount_cop'],
        period_months=serializer.validated_data['period_months'],
        method=serializer.validated_data['method'],
        reference=serializer.validated_data.get('reference', ''),
        notes=serializer.validated_data.get('notes', ''),
    )
    return Response({
        'payment': MerchantPaymentSerializer(payment).data,
        'merchant': MerchantDashboardSerializer(merchant).data,
    }, status=status.HTTP_201_CREATED)
