"""push_notify.send_to + build_match_mutual_payload.

`webpush` (pywebpush) is mocked — it is the external boundary; we never
hit a real push service in tests.
"""
from types import SimpleNamespace

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

from albunmania_app.models import PushSubscription
from albunmania_app.services import push_notify
from albunmania_app.services.push_notify import WebPushException

User = get_user_model()


def _make_user(email='push@example.com'):
    return User.objects.create_user(email=email, password='pw')


def _make_sub(user, endpoint):
    return PushSubscription.objects.create(
        user=user, endpoint=endpoint, p256dh='p256dh-key', auth='auth-secret',
    )


# ---------------------------------------------------------------- build_match_mutual_payload

def test_build_match_mutual_payload_has_the_match_url():
    payload = push_notify.build_match_mutual_payload(match_id=7, other_user_email='b@example.com')

    assert payload['data'] == {'url': '/match/7'}


def test_build_match_mutual_payload_mentions_the_other_user():
    payload = push_notify.build_match_mutual_payload(match_id=7, other_user_email='b@example.com')

    assert 'b@example.com' in payload['body']


def test_build_match_mutual_payload_carries_icon_and_badge():
    payload = push_notify.build_match_mutual_payload(match_id=7, other_user_email='b@example.com')

    assert payload['title']
    assert payload['icon']
    assert payload['badge']


# ---------------------------------------------------------------- send_to: guard rails

@pytest.mark.django_db
def test_send_to_returns_zero_when_vapid_private_key_is_unset(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/a')
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', '')

    assert push_notify.send_to(user, {'title': 'x'}) == (0, 0)


@pytest.mark.django_db
def test_send_to_returns_zero_when_user_has_no_subscriptions(monkeypatch):
    user = _make_user()
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')
    monkeypatch.setattr(push_notify, 'webpush', lambda **_kwargs: None)

    assert push_notify.send_to(user, {'title': 'x'}) == (0, 0)


# ---------------------------------------------------------------- send_to: delivery

@pytest.mark.django_db
def test_send_to_posts_once_per_subscription(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/a')
    _make_sub(user, 'https://push.example.invalid/b')
    calls = []
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')
    monkeypatch.setattr(push_notify, 'webpush', lambda **kwargs: calls.append(kwargs))

    sent, dropped = push_notify.send_to(user, {'title': 'hi'})

    assert (sent, dropped) == (2, 0)
    assert len(calls) == 2
    assert {c['subscription_info']['endpoint'] for c in calls} == {
        'https://push.example.invalid/a',
        'https://push.example.invalid/b',
    }


@pytest.mark.django_db
def test_send_to_passes_the_subscription_keys_to_webpush(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/a')
    captured = {}
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')
    monkeypatch.setattr(push_notify, 'webpush', lambda **kwargs: captured.update(kwargs))

    push_notify.send_to(user, {'title': 'hi'})

    assert captured['subscription_info']['keys'] == {'p256dh': 'p256dh-key', 'auth': 'auth-secret'}


# ---------------------------------------------------------------- send_to: stale subscription cleanup

@pytest.mark.django_db
def test_send_to_deletes_subscriptions_that_return_410(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/gone')
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')

    def _gone(**_kwargs):
        raise WebPushException('gone', response=SimpleNamespace(status_code=410))

    monkeypatch.setattr(push_notify, 'webpush', _gone)

    sent, dropped = push_notify.send_to(user, {'title': 'hi'})

    assert (sent, dropped) == (0, 1)
    assert not PushSubscription.objects.filter(endpoint='https://push.example.invalid/gone').exists()


@pytest.mark.django_db
def test_send_to_keeps_subscriptions_on_non_stale_webpush_errors(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/flaky')
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')

    def _server_error(**_kwargs):
        raise WebPushException('boom', response=SimpleNamespace(status_code=500))

    monkeypatch.setattr(push_notify, 'webpush', _server_error)

    sent, dropped = push_notify.send_to(user, {'title': 'hi'})

    assert (sent, dropped) == (0, 0)
    assert PushSubscription.objects.filter(endpoint='https://push.example.invalid/flaky').exists()


@pytest.mark.django_db
def test_send_to_swallows_unexpected_errors_without_deleting(monkeypatch):
    user = _make_user()
    _make_sub(user, 'https://push.example.invalid/oops')
    monkeypatch.setattr(settings, 'VAPID_PRIVATE_KEY', 'test-private-key')

    def _unexpected(**_kwargs):
        raise ValueError('unexpected')

    monkeypatch.setattr(push_notify, 'webpush', _unexpected)

    sent, dropped = push_notify.send_to(user, {'title': 'hi'})

    assert (sent, dropped) == (0, 0)
    assert PushSubscription.objects.filter(endpoint='https://push.example.invalid/oops').exists()
