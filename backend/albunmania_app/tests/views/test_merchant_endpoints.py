"""Merchant endpoints — public list, dashboard, admin promote/payment."""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from albunmania_app.models import MerchantProfile


User = get_user_model()


def _make_active_merchant(email='m@x.com', city='Bogotá', lat=4.7, lng=-74.0):
    user = User.objects.create_user(email=email, password='pw')
    user.assign_role(User.Role.MERCHANT)
    user.profile.city = city
    user.profile.save()
    profile = MerchantProfile.objects.get(user=user)
    profile.business_name = 'Papelería X'
    profile.business_type = 'papeleria'
    profile.lat = Decimal(str(lat))
    profile.lng = Decimal(str(lng))
    profile.subscription_status = 'active'
    profile.subscription_expires_at = timezone.now() + timedelta(days=30)
    profile.save()
    return user, profile


@pytest.mark.django_db
def test_public_list_only_returns_active_subscriptions():
    _make_active_merchant(email='active@x.com')
    inactive_user = User.objects.create_user(email='inactive@x.com', password='pw')
    inactive_user.assign_role(User.Role.MERCHANT)
    profile = MerchantProfile.objects.get(user=inactive_user)
    profile.lat = Decimal('4.7'); profile.lng = Decimal('-74.0')
    profile.save()  # subscription_status remains 'inactive'

    client = APIClient()
    res = client.get('/api/merchants/')
    assert res.status_code == 200
    emails = [r['business_name'] for r in res.json()['results']]
    assert 'Papelería X' in emails


@pytest.mark.django_db
def test_public_list_filters_by_city():
    _make_active_merchant(email='b@x.com', city='Bogotá')
    _make_active_merchant(email='m@x.com', city='Medellín')

    client = APIClient()
    res = client.get('/api/merchants/?city=Medellín')
    assert res.status_code == 200
    assert len(res.json()['results']) == 1


@pytest.mark.django_db
def test_public_list_filters_by_radius():
    _make_active_merchant(email='near@x.com', lat=4.7, lng=-74.0)
    _make_active_merchant(email='far@x.com', lat=6.24, lng=-75.58)

    client = APIClient()
    res = client.get('/api/merchants/?lat=4.7&lng=-74.0&radius_km=10')
    assert res.status_code == 200
    assert len(res.json()['results']) == 1


@pytest.mark.django_db
def test_dashboard_get_requires_merchant_profile():
    plain = User.objects.create_user(email='plain@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=plain)
    res = client.get('/api/merchants/me/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_dashboard_patch_updates_business_fields():
    user, _ = _make_active_merchant()
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.patch('/api/merchants/me/', {'business_name': 'Papelería Y'}, format='json')
    assert res.status_code == 200
    assert res.json()['business_name'] == 'Papelería Y'


@pytest.mark.django_db
def test_dashboard_cannot_self_extend_subscription():
    user, _ = _make_active_merchant()
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.patch('/api/merchants/me/', {'subscription_status': 'expired'}, format='json')
    assert res.status_code == 200
    user.merchant_profile.refresh_from_db()
    assert user.merchant_profile.subscription_status == 'active'  # unchanged


@pytest.mark.django_db
def test_admin_promote_requires_web_manager_role():
    plain = User.objects.create_user(email='plain@x.com', password='pw')
    target = User.objects.create_user(email='target@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=plain)
    res = client.post(f'/api/merchants/admin/{target.id}/promote/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_promote_assigns_merchant_role():
    wm = User.objects.create_user(email='wm@x.com', password='pw')
    wm.assign_role(User.Role.WEB_MANAGER)
    target = User.objects.create_user(email='target@x.com', password='pw')

    client = APIClient()
    client.force_authenticate(user=wm)
    res = client.post(f'/api/merchants/admin/{target.id}/promote/')
    assert res.status_code == 200
    assert res.json()['role'] == 'merchant'


@pytest.mark.django_db
def test_admin_register_payment_extends_subscription():
    wm = User.objects.create_user(email='wm@x.com', password='pw')
    wm.assign_role(User.Role.WEB_MANAGER)
    user, profile = _make_active_merchant()

    client = APIClient()
    client.force_authenticate(user=wm)
    res = client.post(
        f'/api/merchants/admin/{user.id}/payment/',
        {'amount_cop': '200000', 'period_months': 1, 'method': 'nequi'},
        format='json',
    )
    assert res.status_code == 201
    profile.refresh_from_db()
    assert profile.subscription_status == 'active'
