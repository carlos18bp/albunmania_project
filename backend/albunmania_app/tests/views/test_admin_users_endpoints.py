"""Admin users endpoints — list, role assignment, block toggle."""
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
def test_list_requires_web_manager_or_admin():
    plain = User.objects.create_user(email='plain@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=plain)
    assert client.get('/api/admin/users/').status_code == 403


@pytest.mark.django_db
def test_list_returns_paginated_results(web_manager):
    for i in range(3):
        User.objects.create_user(email=f'u{i}@x.com', password='pw')

    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.get('/api/admin/users/?page_size=2')
    assert res.status_code == 200
    body = res.json()
    assert body['page_size'] == 2
    assert body['total'] >= 4


@pytest.mark.django_db
def test_list_search_filters_by_email_substring(web_manager):
    User.objects.create_user(email='maria@x.com', password='pw')
    User.objects.create_user(email='pedro@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.get('/api/admin/users/?q=maria')
    emails = [r['email'] for r in res.json()['results']]
    assert 'maria@x.com' in emails
    assert 'pedro@x.com' not in emails


@pytest.mark.django_db
def test_assign_role_persists(web_manager):
    target = User.objects.create_user(email='t@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.post(f'/api/admin/users/{target.id}/role/', {'role': 'merchant'}, format='json')
    assert res.status_code == 200
    target.refresh_from_db()
    assert target.role == 'merchant'


@pytest.mark.django_db
def test_assign_role_rejects_invalid_role(web_manager):
    target = User.objects.create_user(email='t@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.post(f'/api/admin/users/{target.id}/role/', {'role': 'pirate'}, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_block_user_sets_is_active_false(web_manager):
    target = User.objects.create_user(email='t@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.post(f'/api/admin/users/{target.id}/active/', {'is_active': False}, format='json')
    assert res.status_code == 200
    target.refresh_from_db()
    assert target.is_active is False


@pytest.mark.django_db
def test_cannot_block_self(web_manager):
    client = APIClient()
    client.force_authenticate(user=web_manager)
    res = client.post(f'/api/admin/users/{web_manager.id}/active/', {'is_active': False}, format='json')
    assert res.status_code == 400
