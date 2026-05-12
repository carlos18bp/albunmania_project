"""Notification model — basics."""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from albunmania_app.models import Notification

User = get_user_model()


@pytest.mark.django_db
def test_is_read_reflects_read_at():
    user = User.objects.create_user(email='n@example.com', password='pw')
    n = Notification.objects.create(user=user, kind=Notification.Kind.MATCH_MUTUAL, title='x')

    assert n.is_read is False
    n.read_at = timezone.now()
    n.save(update_fields=['read_at'])
    n.refresh_from_db()
    assert n.is_read is True


@pytest.mark.django_db
def test_default_ordering_is_newest_first():
    user = User.objects.create_user(email='n@example.com', password='pw')
    first = Notification.objects.create(user=user, kind=Notification.Kind.MATCH_MUTUAL, title='first')
    second = Notification.objects.create(user=user, kind=Notification.Kind.REVIEW_RECEIVED, title='second')

    ordered = list(Notification.objects.filter(user=user))
    assert ordered == [second, first]
