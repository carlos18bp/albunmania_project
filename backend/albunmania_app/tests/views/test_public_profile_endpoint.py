"""GET /api/users/<id>/public-profile/ tests."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from albunmania_app.models import Album, Match, Review, Sticker, Trade, UserSticker

User = get_user_model()


def _album_with_stickers(n=10):
    album = Album.objects.create(name='Mundial 26', slug='mundial-26', edition_year=2026, total_stickers=n)
    stickers = [Sticker.objects.create(album=album, number=f'{i:02d}', name=f'S{i}') for i in range(1, n + 1)]
    return album, stickers


@pytest.mark.django_db
def test_404_for_unknown_user(api_client):
    response = api_client.get(reverse('user-public-profile', args=[999_999]))
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_returns_display_name_city_and_reputation(api_client):
    user = User.objects.create_user(email='lucia@example.com', password='pw', first_name='Lucía', last_name='Rojas')
    user.profile.city = 'Bogotá'
    user.profile.save(update_fields=['city'])

    response = api_client.get(reverse('user-public-profile', args=[user.id]))

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['user_id'] == user.id
    assert body['display_name'] == 'Lucía Rojas'
    assert body['city'] == 'Bogotá'
    assert Decimal(body['rating_avg']) == Decimal('0.00')
    assert body['rating_count'] == 0


@pytest.mark.django_db
def test_does_not_expose_email_or_phone(api_client):
    user = User.objects.create_user(email='secret@example.com', password='pw', first_name='Ana')
    user.profile.whatsapp_e164 = '+573001112222'
    user.profile.save(update_fields=['whatsapp_e164'])

    body = api_client.get(reverse('user-public-profile', args=[user.id])).json()

    assert 'email' not in body
    assert 'secret@example.com' not in str(body)
    assert '+573001112222' not in str(body)
    assert 'whatsapp_e164' not in body


@pytest.mark.django_db
def test_album_completion_pct_reflects_pasted_stickers(api_client):
    album, stickers = _album_with_stickers(n=10)
    user = User.objects.create_user(email='c@example.com', password='pw', first_name='C')
    user.profile.active_album_id = album.id
    user.profile.save(update_fields=['active_album_id'])
    for s in stickers[:3]:
        UserSticker.objects.create(user=user, sticker=s, count=1)
    UserSticker.objects.create(user=user, sticker=stickers[3], count=0)  # not pasted → doesn't count

    body = api_client.get(reverse('user-public-profile', args=[user.id])).json()

    assert Decimal(body['album_completion_pct']) == Decimal('30.00')  # 3 of 10


@pytest.mark.django_db
def test_album_completion_pct_zero_when_no_active_album(api_client):
    user = User.objects.create_user(email='c@example.com', password='pw', first_name='C')

    body = api_client.get(reverse('user-public-profile', args=[user.id])).json()

    assert Decimal(body['album_completion_pct']) == Decimal('0')


@pytest.mark.django_db
def test_trades_completed_count(api_client):
    a = User.objects.create_user(email='a@example.com', password='pw', first_name='A')
    b = User.objects.create_user(email='b@example.com', password='pw', first_name='B')
    ua, ub = (a, b) if a.id < b.id else (b, a)
    m_done = Match.objects.create(user_a=ua, user_b=ub, channel=Match.Channel.SWIPE, status=Match.Status.MUTUAL)
    Trade.objects.create(match=m_done, items=[], status=Trade.Status.COMPLETED)
    m_open = Match.objects.create(user_a=ua, user_b=ub, channel=Match.Channel.QR_PRESENCIAL, status=Match.Status.MUTUAL)
    Trade.objects.create(match=m_open, items=[], status=Trade.Status.OPEN)  # not completed → doesn't count

    body = api_client.get(reverse('user-public-profile', args=[a.id])).json()

    assert body['trades_completed_count'] == 1


@pytest.mark.django_db
def test_reputation_reflects_visible_reviews(api_client):
    a = User.objects.create_user(email='a@example.com', password='pw', first_name='A')
    b = User.objects.create_user(email='b@example.com', password='pw', first_name='B')
    ua, ub = (a, b) if a.id < b.id else (b, a)
    match = Match.objects.create(user_a=ua, user_b=ub, channel=Match.Channel.SWIPE, status=Match.Status.MUTUAL)
    trade = Trade.objects.create(match=match, items=[], status=Trade.Status.COMPLETED)
    Review.objects.create(trade=trade, reviewer=a, reviewee=b, stars=5)

    body = api_client.get(reverse('user-public-profile', args=[b.id])).json()

    assert body['rating_count'] == 1
    assert Decimal(body['rating_avg']) == Decimal('5.00')
    assert Decimal(body['positive_pct']) == Decimal('100.00')
