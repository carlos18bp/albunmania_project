"""Huey tasks — deliver_match_push (off-the-request-path match push)."""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import PushSubscription
from albunmania_project.tasks import deliver_match_push

User = get_user_model()

_PAYLOAD = {'title': 't', 'body': 'b', 'icon': '/i', 'badge': '/b', 'data': {'url': '/match/1'}}


@pytest.mark.django_db
def test_deliver_match_push_calls_send_to_for_an_existing_user():
    user = User.objects.create_user(email='push@example.com', password='pw')
    PushSubscription.objects.create(user=user, endpoint='https://e/x', p256dh='p', auth='a')

    with patch('albunmania_app.services.push_notify.send_to') as mock_send:
        # Huey runs in immediate mode in tests, so this executes synchronously.
        deliver_match_push(user.id, _PAYLOAD)

    mock_send.assert_called_once()
    assert mock_send.call_args.args[0].id == user.id
    assert mock_send.call_args.args[1] == _PAYLOAD


@pytest.mark.django_db
def test_deliver_match_push_is_a_noop_for_a_missing_user():
    with patch('albunmania_app.services.push_notify.send_to') as mock_send:
        deliver_match_push(999_999, _PAYLOAD)  # no such user

    mock_send.assert_not_called()


@pytest.mark.django_db
def test_deliver_match_push_actually_delivers_via_pywebpush(monkeypatch):
    """End to end through the real send_to, with pywebpush mocked."""
    from albunmania_app.services import push_notify
    from django.conf import settings

    user = User.objects.create_user(email='real@example.com', password='pw')
    PushSubscription.objects.create(user=user, endpoint='https://e/y', p256dh='p', auth='a')
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')
    calls = []
    monkeypatch.setattr(push_notify, 'webpush', lambda **kwargs: calls.append(kwargs))

    deliver_match_push(user.id, _PAYLOAD)

    assert len(calls) == 1
