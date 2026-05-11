"""Match model — canonical pair + uniqueness."""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

from albunmania_app.models import Match


User = get_user_model()


@pytest.fixture
def two_users(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    return a, b


@pytest.mark.django_db
def test_canonical_pair_orders_ids(two_users):
    a, b = two_users
    pair = Match.canonical_pair(b.id, a.id)
    assert pair == (a.id, b.id)


@pytest.mark.django_db
def test_canonical_pair_rejects_self_match(two_users):
    a, _ = two_users
    with pytest.raises(ValueError):
        Match.canonical_pair(a.id, a.id)


@pytest.mark.django_db
def test_match_check_constraint_user_a_lt_user_b(two_users):
    a, b = two_users
    with transaction.atomic(), pytest.raises(IntegrityError):
        Match.objects.create(user_a=b, user_b=a, channel=Match.Channel.SWIPE)


@pytest.mark.django_db
def test_match_unique_per_pair_and_channel(two_users):
    a, b = two_users
    Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    with transaction.atomic(), pytest.raises(IntegrityError):
        Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)


@pytest.mark.django_db
def test_match_allows_two_channels_per_pair(two_users):
    a, b = two_users
    Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    qr = Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.QR_PRESENCIAL)
    assert qr.id is not None
