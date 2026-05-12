"""Report model — the target/kind CheckConstraint."""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

from albunmania_app.models import Album, Match, Report, Sticker, Trade

User = get_user_model()


@pytest.mark.django_db
def test_user_report_requires_target_user_and_no_target_trade():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')

    # Valid: kind=user + target_user set + target_trade null.
    Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, target_user=b, reason=Report.Reason.HARASSMENT)

    # Invalid: kind=user but target_user null.
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, reason=Report.Reason.OTHER)


@pytest.mark.django_db
def test_trade_report_requires_target_trade_and_no_target_user():
    album = Album.objects.create(name='M', slug='m', edition_year=2026, total_stickers=1)
    Sticker.objects.create(album=album, number='1', name='S')
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    ua, ub = (a, b) if a.id < b.id else (b, a)
    match = Match.objects.create(user_a=ua, user_b=ub, channel=Match.Channel.SWIPE, status=Match.Status.MUTUAL)
    trade = Trade.objects.create(match=match, items=[], status=Trade.Status.COMPLETED)

    # Valid.
    Report.objects.create(reporter=a, target_kind=Report.TargetKind.TRADE, target_trade=trade, reason=Report.Reason.NO_SHOW)

    # Invalid: kind=trade but also target_user set.
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            Report.objects.create(
                reporter=a, target_kind=Report.TargetKind.TRADE,
                target_trade=trade, target_user=b, reason=Report.Reason.OTHER,
            )
