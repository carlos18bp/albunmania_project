"""In-app notification endpoints + the events that create notifications."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Notification, Review, Sticker, Trade

User = get_user_model()


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _mutual_match(a, b, channel=Match.Channel.SWIPE):
    ua, ub = (a, b) if a.id < b.id else (b, a)
    return Match.objects.create(user_a=ua, user_b=ub, channel=channel, status=Match.Status.MUTUAL)


# ---------------------------------------------------------------- list / unread / pagination

@pytest.mark.django_db
def test_list_requires_authentication():
    assert APIClient().get(reverse('notification-list')).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_list_returns_only_own_notifications_newest_first():
    me = User.objects.create_user(email='me@example.com', password='pw')
    other = User.objects.create_user(email='other@example.com', password='pw')
    Notification.objects.create(user=other, kind=Notification.Kind.MATCH_MUTUAL, title='not mine')
    n1 = Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='mine 1')
    n2 = Notification.objects.create(user=me, kind=Notification.Kind.REVIEW_RECEIVED, title='mine 2')

    body = _client(me).get(reverse('notification-list')).json()

    assert body['total'] == 2
    assert [r['id'] for r in body['results']] == [n2.id, n1.id]


@pytest.mark.django_db
def test_unread_filter():
    me = User.objects.create_user(email='me@example.com', password='pw')
    Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='unread')
    read = Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='read')
    _client(me).post(reverse('notification-mark-read', args=[read.id]))

    body = _client(me).get(reverse('notification-list'), {'unread': 'true'}).json()

    assert body['total'] == 1
    assert body['results'][0]['title'] == 'unread'


@pytest.mark.django_db
def test_invalid_pagination_returns_400():
    me = User.objects.create_user(email='me@example.com', password='pw')
    resp = _client(me).get(reverse('notification-list'), {'page': 'abc'})
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------- unread-count

@pytest.mark.django_db
def test_unread_count():
    me = User.objects.create_user(email='me@example.com', password='pw')
    Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='a')
    Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='b')

    body = _client(me).get(reverse('notification-unread-count')).json()

    assert body == {'count': 2}


# ---------------------------------------------------------------- mark read

@pytest.mark.django_db
def test_mark_read_sets_read_at_and_is_idempotent():
    me = User.objects.create_user(email='me@example.com', password='pw')
    n = Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='a')

    first = _client(me).post(reverse('notification-mark-read', args=[n.id]))
    assert first.status_code == status.HTTP_200_OK
    assert first.json()['is_read'] is True
    n.refresh_from_db()
    stamp = n.read_at
    _client(me).post(reverse('notification-mark-read', args=[n.id]))
    n.refresh_from_db()
    assert n.read_at == stamp  # unchanged on the second call


@pytest.mark.django_db
def test_cannot_mark_someone_elses_notification():
    me = User.objects.create_user(email='me@example.com', password='pw')
    other = User.objects.create_user(email='other@example.com', password='pw')
    n = Notification.objects.create(user=other, kind=Notification.Kind.MATCH_MUTUAL, title='a')

    resp = _client(me).post(reverse('notification-mark-read', args=[n.id]))
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_mark_all_read():
    me = User.objects.create_user(email='me@example.com', password='pw')
    Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='a')
    Notification.objects.create(user=me, kind=Notification.Kind.MATCH_MUTUAL, title='b')

    resp = _client(me).post(reverse('notification-read-all'))

    assert resp.json() == {'marked_read': 2}
    assert Notification.objects.filter(user=me, read_at__isnull=True).count() == 0


# ---------------------------------------------------------------- events that create notifications

@pytest.mark.django_db
def test_mutual_match_creates_a_notification_for_each_participant():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')

    _mutual_match(a, b)

    assert Notification.objects.filter(user=a, kind=Notification.Kind.MATCH_MUTUAL).count() == 1
    assert Notification.objects.filter(user=b, kind=Notification.Kind.MATCH_MUTUAL).count() == 1
    n = Notification.objects.get(user=a)
    assert n.actor_id == b.id
    assert n.url.startswith('/match/')


@pytest.mark.django_db
def test_creating_a_review_notifies_the_reviewee():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    match = _mutual_match(a, b)
    trade = Trade.objects.create(match=match, items=[], status=Trade.Status.COMPLETED)

    resp = _client(a).post(reverse('trade-review-create', args=[trade.id]), {'stars': 5, 'comment': 'great'}, format='json')
    assert resp.status_code == status.HTTP_201_CREATED

    n = Notification.objects.get(user=b, kind=Notification.Kind.REVIEW_RECEIVED)
    assert n.actor_id == a.id
    assert n.url == '/profile/me'
    assert '5★' in n.body


@pytest.mark.django_db
def test_replying_to_a_review_notifies_the_reviewer():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    match = _mutual_match(a, b)
    trade = Trade.objects.create(match=match, items=[], status=Trade.Status.COMPLETED)
    review = Review.objects.create(trade=trade, reviewer=a, reviewee=b, stars=4)

    resp = _client(b).post(reverse('review-reply', args=[review.id]), {'reply': 'gracias!'}, format='json')
    assert resp.status_code == status.HTTP_200_OK

    n = Notification.objects.get(user=a, kind=Notification.Kind.REVIEW_REPLY)
    assert n.actor_id == b.id
    assert n.url == f'/profile/{b.id}'
