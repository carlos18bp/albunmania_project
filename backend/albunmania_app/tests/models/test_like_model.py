"""Like model — uniqueness + mirror detection."""
import pytest
from django.contrib.auth import get_user_model

from albunmania_app.models import Album, Like, Sticker


User = get_user_model()


@pytest.fixture
def album(db):
    return Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)


@pytest.fixture
def stickers(db, album):
    return [
        Sticker.objects.create(album=album, number='1', name='S1'),
        Sticker.objects.create(album=album, number='2', name='S2'),
    ]


@pytest.fixture
def two_users(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    return a, b


@pytest.mark.django_db
def test_like_find_mirror_returns_none_when_no_inverse(two_users, stickers):
    a, b = two_users
    s1, s2 = stickers
    like = Like.objects.create(from_user=a, to_user=b, sticker_offered=s1, sticker_wanted=s2)
    assert like.find_mirror() is None


@pytest.mark.django_db
def test_like_find_mirror_detects_inverse(two_users, stickers):
    a, b = two_users
    s1, s2 = stickers
    Like.objects.create(from_user=a, to_user=b, sticker_offered=s1, sticker_wanted=s2)
    inverse = Like.objects.create(from_user=b, to_user=a, sticker_offered=s2, sticker_wanted=s1)
    mirror = inverse.find_mirror()
    assert mirror is not None
    assert mirror.from_user_id == a.id


@pytest.mark.django_db
def test_like_unique_per_quad(two_users, stickers):
    from django.db import IntegrityError, transaction
    a, b = two_users
    s1, s2 = stickers
    Like.objects.create(from_user=a, to_user=b, sticker_offered=s1, sticker_wanted=s2)
    with transaction.atomic(), pytest.raises(IntegrityError):
        Like.objects.create(from_user=a, to_user=b, sticker_offered=s1, sticker_wanted=s2)
