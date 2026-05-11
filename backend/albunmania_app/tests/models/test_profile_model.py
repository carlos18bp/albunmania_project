"""Profile model tests — autoprovision + defaults + cascade."""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from albunmania_app.models import Profile


@pytest.mark.django_db
def test_profile_is_created_automatically_on_user_creation():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    assert Profile.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_profile_defaults_match_spec():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    profile = user.profile

    assert profile.city == ''
    assert profile.lat_approx is None
    assert profile.lng_approx is None
    assert profile.active_album_id is None
    assert profile.whatsapp_optin is False
    assert profile.push_optin is False
    assert profile.browser_geo_optin is False
    assert profile.whatsapp_e164 == ''
    assert profile.rating_count == 0
    assert profile.is_onboarded is False


@pytest.mark.django_db
def test_profile_is_onboarded_flips_when_album_is_set():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    profile = user.profile

    profile.active_album_id = 1
    profile.save()

    assert profile.is_onboarded is True


@pytest.mark.django_db
def test_profile_is_deleted_when_user_is_deleted():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    profile_id = user.profile.id

    user.delete()

    assert Profile.objects.filter(id=profile_id).count() == 0


@pytest.mark.django_db
def test_profile_str_includes_email():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    assert 'c@example.com' in str(user.profile)


@pytest.mark.django_db
def test_profile_unique_per_user():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    with pytest.raises(IntegrityError):
        Profile.objects.create(user=user)
