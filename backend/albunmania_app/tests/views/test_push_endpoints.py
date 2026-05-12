"""Push subscription endpoints + signal-driven notification."""
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from albunmania_app.models import Match, PushSubscription


User = get_user_model()


def _payload(endpoint='https://fcm.googleapis.com/send/abc'):
    return {
        'endpoint': endpoint,
        'keys': {
            'p256dh': 'BHpzr...stub',
            'auth': 'authstub',
        },
    }


@pytest.mark.django_db
def test_public_key_endpoint_returns_settings_value(settings):
    settings.VAPID_PUBLIC_KEY = 'BFakeKey'
    client = APIClient()
    res = client.get('/api/push/public-key/')
    assert res.status_code == 200
    assert res.json() == {'public_key': 'BFakeKey'}


@pytest.mark.django_db
def test_subscribe_persists_a_new_subscription():
    user = User.objects.create_user(email='a@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.post('/api/push/subscribe/', _payload(), format='json')
    assert res.status_code == 201
    assert PushSubscription.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_subscribe_is_idempotent_per_endpoint():
    user = User.objects.create_user(email='a@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    client.post('/api/push/subscribe/', _payload(), format='json')
    res = client.post('/api/push/subscribe/', _payload(), format='json')
    assert res.status_code == 200  # update_or_create branch
    assert PushSubscription.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_subscribe_rejects_missing_keys():
    user = User.objects.create_user(email='a@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.post('/api/push/subscribe/', {'endpoint': 'x'}, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_unsubscribe_removes_only_callers_subscription():
    user = User.objects.create_user(email='a@x.com', password='pw')
    other = User.objects.create_user(email='b@x.com', password='pw')
    PushSubscription.objects.create(
        user=user, endpoint='https://e/1', p256dh='p', auth='a',
    )
    PushSubscription.objects.create(
        user=other, endpoint='https://e/2', p256dh='p', auth='a',
    )
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.post(
        '/api/push/unsubscribe/', {'endpoint': 'https://e/2'}, format='json',
    )
    assert res.status_code == 200
    assert res.json() == {'deleted': 0}  # belongs to `other`, not deleted
    assert PushSubscription.objects.filter(endpoint='https://e/2').exists()


@pytest.mark.django_db
def test_mutual_match_signal_fires_push_to_both_participants():
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    PushSubscription.objects.create(
        user=a, endpoint='https://e/a', p256dh='p', auth='a',
    )
    PushSubscription.objects.create(
        user=b, endpoint='https://e/b', p256dh='p', auth='a',
    )
    a_id, b_id = (a.id, b.id) if a.id < b.id else (b.id, a.id)

    # The signal enqueues `deliver_match_push` (a Huey task); in tests Huey runs
    # in immediate mode, so the task executes synchronously and calls
    # push_notify.send_to — patch it at the source.
    with patch('albunmania_app.services.push_notify.send_to') as mock_send:
        Match.objects.create(
            user_a_id=a_id, user_b_id=b_id,
            channel=Match.Channel.SWIPE, status=Match.Status.MUTUAL,
        )

    assert mock_send.call_count == 2
    user_args = sorted(call.args[0].id for call in mock_send.call_args_list)
    assert user_args == sorted([a.id, b.id])
