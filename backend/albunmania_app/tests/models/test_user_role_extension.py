"""User.Role + assign_role helper tests."""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


@pytest.mark.django_db
def test_role_choices_match_albunmania_spec():
    User = get_user_model()
    expected = {'collector', 'merchant', 'web_manager', 'admin'}

    actual = {choice.value for choice in User.Role}

    assert actual == expected


@pytest.mark.django_db
def test_assign_role_creates_and_attaches_group():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    user.assign_role(User.Role.WEB_MANAGER)

    assert user.role == 'web_manager'
    assert user.groups.filter(name='web_manager').exists()


@pytest.mark.django_db
def test_assign_role_is_idempotent():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    user.assign_role(User.Role.WEB_MANAGER)
    user.assign_role(User.Role.WEB_MANAGER)

    assert user.groups.filter(name='web_manager').count() == 1


@pytest.mark.django_db
def test_assign_role_removes_previous_albunmania_group():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')

    user.assign_role(User.Role.MERCHANT)
    user.assign_role(User.Role.WEB_MANAGER)

    assert user.groups.filter(name='merchant').count() == 0
    assert user.groups.filter(name='web_manager').count() == 1


@pytest.mark.django_db
def test_assign_role_does_not_touch_unrelated_groups():
    User = get_user_model()
    user = User.objects.create_user(email='c@example.com', password='pass1234')
    other_group = Group.objects.create(name='moderators')
    user.groups.add(other_group)

    user.assign_role(User.Role.ADMIN)

    assert user.groups.filter(name='moderators').exists()
    assert user.groups.filter(name='admin').exists()
