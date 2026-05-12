import pytest
from django.contrib.auth import get_user_model

from albunmania_app.utils import auth_utils


@pytest.mark.django_db
def test_generate_auth_tokens_contains_user_payload():
    User = get_user_model()
    user = User.objects.create_user(email='tokens@example.com', password='pass1234')

    tokens = auth_utils.generate_auth_tokens(user)

    assert tokens['user']['email'] == 'tokens@example.com'
    assert tokens['user']['id'] == user.id
    assert tokens['refresh']
    assert tokens['access']


@pytest.mark.django_db
def test_generate_auth_tokens_includes_role_and_staff_flag():
    User = get_user_model()
    user = User.objects.create_user(email='roleful@example.com', password='pass1234', is_staff=True)

    tokens = auth_utils.generate_auth_tokens(user)

    assert tokens['user']['is_staff'] is True
    assert tokens['user']['role'] == user.role
