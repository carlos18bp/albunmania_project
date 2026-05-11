"""Admin analytics endpoints."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


User = get_user_model()


@pytest.fixture
def web_manager(db):
    wm = User.objects.create_user(email='wm@x.com', password='pw')
    wm.assign_role(User.Role.WEB_MANAGER)
    return wm


@pytest.mark.django_db
def test_overview_requires_admin_or_wm():
    plain = User.objects.create_user(email='plain@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=plain)
    assert client.get('/api/admin/analytics/overview/').status_code == 403


@pytest.mark.django_db
def test_overview_returns_all_blocks(web_manager):
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.get('/api/admin/analytics/overview/')
    assert res.status_code == 200
    body = res.json()
    for key in ('community', 'ads', 'returning_vs_new', 'devices', 'top_stickers', 'matches_trend', 'heatmap'):
        assert key in body


@pytest.mark.django_db
def test_overview_rejects_invalid_album_id(web_manager):
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.get('/api/admin/analytics/overview/?album_id=notanumber')
    assert res.status_code == 400


@pytest.mark.django_db
def test_export_csv_returns_csv_content_type(web_manager):
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.get('/api/admin/analytics/export.csv')
    assert res.status_code == 200
    assert res['Content-Type'].startswith('text/csv')
    assert b'albunman' in res.content.lower()
