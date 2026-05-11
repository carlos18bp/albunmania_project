"""ad_engine.select_creative + serve_banner."""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import AdCampaign, AdCreative, AdImpression
from albunmania_app.services.ad_engine import select_creative, serve_banner


User = get_user_model()


def _make_campaign(**overrides) -> AdCampaign:
    defaults = dict(
        advertiser_name='Coca-Cola',
        impressions_purchased=10000,
        impressions_served=0,
        cpm_rate_cop=Decimal('15000'),
        weight=1,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=30),
        status=AdCampaign.Status.ACTIVE,
    )
    defaults.update(overrides)
    user = User.objects.create_user(email=f'wm-{date.today()}-{overrides.get("advertiser_name", "x")}@x.com', password='pw')
    return AdCampaign.objects.create(created_by=user, **defaults)


@pytest.mark.django_db
def test_no_creatives_returns_none():
    assert select_creative('home', 'Bogotá') is None


@pytest.mark.django_db
def test_serves_active_creative():
    campaign = _make_campaign()
    creative = AdCreative.objects.create(
        campaign=campaign, image_url='https://x/i.png', click_url='https://x/click',
    )
    assert select_creative('home', 'Bogotá').id == creative.id


@pytest.mark.django_db
def test_skips_paused_campaign():
    campaign = _make_campaign(status=AdCampaign.Status.PAUSED)
    AdCreative.objects.create(campaign=campaign, image_url='', click_url='')
    assert select_creative('home', 'Bogotá') is None


@pytest.mark.django_db
def test_skips_exhausted_budget():
    campaign = _make_campaign(impressions_purchased=10, impressions_served=10)
    AdCreative.objects.create(campaign=campaign, image_url='', click_url='')
    assert select_creative('home', 'Bogotá') is None


@pytest.mark.django_db
def test_skips_geo_targeted_when_city_does_not_match():
    campaign = _make_campaign(geo_targeting_cities='Cali, Medellín')
    AdCreative.objects.create(campaign=campaign, image_url='', click_url='')
    assert select_creative('home', 'Bogotá') is None
    assert select_creative('home', 'Medellín').id is not None


@pytest.mark.django_db
def test_serve_banner_increments_impressions_served():
    campaign = _make_campaign()
    AdCreative.objects.create(campaign=campaign, image_url='', click_url='')
    user = User.objects.create_user(email='viewer@x.com', password='pw')
    serve_banner(slot='home', city='Bogotá', user=user)
    campaign.refresh_from_db()
    assert campaign.impressions_served == 1
    assert AdImpression.objects.filter(creative__campaign=campaign).count() == 1


@pytest.mark.django_db
def test_serve_banner_returns_none_when_no_match():
    assert serve_banner(slot='home', city='Bogotá', user=None) is None
