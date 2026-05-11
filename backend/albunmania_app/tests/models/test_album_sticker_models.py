"""Album + Sticker + UserSticker model tests."""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from albunmania_app.models import Album, Sticker, UserSticker


@pytest.fixture
def album(db):
    return Album.objects.create(name='Mundial 26', slug='mundial-26', edition_year=2026, total_stickers=670)


@pytest.fixture
def sticker(db, album):
    return Sticker.objects.create(album=album, number='42', name='Mbappé', team='Francia')


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user(email='c@example.com', password='pass1234')


@pytest.mark.django_db
def test_album_str_includes_year(album):
    assert '2026' in str(album)


@pytest.mark.django_db
def test_sticker_unique_per_album_number(album):
    Sticker.objects.create(album=album, number='1', name='A')
    with pytest.raises(IntegrityError):
        Sticker.objects.create(album=album, number='1', name='B')


@pytest.mark.django_db
def test_sticker_special_tier_defaults_blank(album):
    s = Sticker.objects.create(album=album, number='1', name='A')
    assert s.special_tier == ''
    assert s.is_special_edition is False


@pytest.mark.django_db
def test_sticker_market_value_default_zero(album):
    s = Sticker.objects.create(album=album, number='1', name='A')
    assert s.market_value_estimate == Decimal('0.00')


@pytest.mark.django_db
def test_user_sticker_unique_per_user_sticker(user, sticker):
    UserSticker.objects.create(user=user, sticker=sticker, count=1)
    with pytest.raises(IntegrityError):
        UserSticker.objects.create(user=user, sticker=sticker, count=2)


@pytest.mark.django_db
def test_user_sticker_is_pasted_when_count_ge_1(user, sticker):
    entry = UserSticker.objects.create(user=user, sticker=sticker, count=1)
    assert entry.is_pasted is True
    assert entry.is_repeated is False


@pytest.mark.django_db
def test_user_sticker_is_repeated_when_count_ge_2(user, sticker):
    entry = UserSticker.objects.create(user=user, sticker=sticker, count=3)
    assert entry.is_pasted is True
    assert entry.is_repeated is True


@pytest.mark.django_db
def test_user_sticker_count_zero_means_missing(user, sticker):
    entry = UserSticker.objects.create(user=user, sticker=sticker, count=0)
    assert entry.is_pasted is False
    assert entry.is_repeated is False
