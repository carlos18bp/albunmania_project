import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _bypass_hcaptcha(monkeypatch):
    """Force the hCaptcha service into bypass mode for the whole suite.

    The captcha service treats an empty `HCAPTCHA_SECRET` as "dev mode"
    and short-circuits verification to True. With a real (or test-key)
    secret in the active .env, every test that POSTs through the auth
    endpoints would otherwise hit the live hCaptcha siteverify URL with
    a stub token and get a 400. Unsetting the secret here keeps the
    auth tests deterministic and offline.
    """
    monkeypatch.setattr(settings, 'HCAPTCHA_SECRET', '')


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def existing_user(db):
    """Regular authenticated user for use in tests requiring a logged-in customer."""
    User = get_user_model()
    return User.objects.create_user(
        email='user@example.com',
        password='existingpassword',
        first_name='Test',
        last_name='User',
    )


@pytest.fixture
def admin_user(db):
    """Staff/admin user for use in tests requiring elevated permissions."""
    User = get_user_model()
    user = User.objects.create_user(
        email='admin@example.com',
        password='adminpassword',
        first_name='Admin',
        last_name='User',
    )
    user.is_staff = True
    user.is_superuser = True
    user.save(update_fields=['is_staff', 'is_superuser'])
    return user


@pytest.fixture
def authenticated_client(api_client, existing_user):
    """APIClient pre-authenticated as a regular user."""
    api_client.force_authenticate(user=existing_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """APIClient pre-authenticated as a staff/admin user."""
    api_client.force_authenticate(user=admin_user)
    return api_client
