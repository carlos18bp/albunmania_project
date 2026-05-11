"""Ad endpoints — public serve + click + admin CRUD."""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import AdCampaign, AdClick, AdCreative, AdImpression


User = get_user_model()


@pytest.fixture
def active_creative(db):
    wm = User.objects.create_user(email='wm@x.com', password='pw')
    wm.assign_role(User.Role.WEB_MANAGER)
    campaign = AdCampaign.objects.create(
        advertiser_name='Coca-Cola',
        impressions_purchased=1000,
        cpm_rate_cop=Decimal('15000'),
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
        status=AdCampaign.Status.ACTIVE,
        created_by=wm,
    )
    creative = AdCreative.objects.create(
        campaign=campaign, image_url='https://x/i.png', click_url='https://x/click',
    )
    return {'wm': wm, 'campaign': campaign, 'creative': creative}


@pytest.mark.django_db
def test_serve_returns_creative_and_records_impression(active_creative):
    client = APIClient()
    res = client.get('/api/ads/serve/?slot=home&city=Bogot%C3%A1')
    assert res.status_code == 200
    body = res.json()
    assert body['creative']['id'] == active_creative['creative'].id
    assert AdImpression.objects.count() == 1


@pytest.mark.django_db
def test_serve_rejects_invalid_slot(active_creative):
    client = APIClient()
    res = client.get('/api/ads/serve/?slot=invalid')
    assert res.status_code == 400


@pytest.mark.django_db
def test_serve_returns_204_when_no_eligible_campaign():
    client = APIClient()
    res = client.get('/api/ads/serve/?slot=home')
    assert res.status_code == 204


@pytest.mark.django_db
def test_click_redirects_and_records(active_creative):
    impression = AdImpression.objects.create(
        creative=active_creative['creative'], slot='home', city='Bogotá',
    )
    client = APIClient()
    res = client.get(f'/api/ads/click/{impression.id}/')
    assert res.status_code == 302
    assert res.url == 'https://x/click'
    assert AdClick.objects.filter(impression=impression).count() == 1


@pytest.mark.django_db
def test_admin_campaigns_requires_web_manager(active_creative):
    plain = User.objects.create_user(email='plain@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=plain)
    res = client.get('/api/ads/admin/campaigns/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_campaigns_list(active_creative):
    client = APIClient()
    client.force_authenticate(user=active_creative['wm'])
    res = client.get('/api/ads/admin/campaigns/')
    assert res.status_code == 200
    assert len(res.json()['results']) == 1


@pytest.mark.django_db
def test_admin_campaign_detail_patch(active_creative):
    client = APIClient()
    client.force_authenticate(user=active_creative['wm'])
    res = client.patch(
        f"/api/ads/admin/campaigns/{active_creative['campaign'].id}/",
        {'status': 'paused'}, format='json',
    )
    assert res.status_code == 200
    active_creative['campaign'].refresh_from_db()
    assert active_creative['campaign'].status == 'paused'


@pytest.mark.django_db
def test_admin_stats_includes_ctr(active_creative):
    impression = AdImpression.objects.create(
        creative=active_creative['creative'], slot='home', city='Bogotá',
    )
    AdClick.objects.create(impression=impression)

    client = APIClient()
    client.force_authenticate(user=active_creative['wm'])
    res = client.get(f"/api/ads/admin/campaigns/{active_creative['campaign'].id}/stats/")
    assert res.status_code == 200
    row = res.json()['results'][0]
    assert row['impressions'] == 1
    assert row['clicks'] == 1
    assert row['ctr'] == 1.0
