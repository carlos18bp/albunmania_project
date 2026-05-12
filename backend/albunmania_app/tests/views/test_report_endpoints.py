"""Report endpoints — create (user/trade) + admin queue + resolve."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Report, Sticker, Trade

User = get_user_model()


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _admin():
    u = User.objects.create_user(email='admin@example.com', password='pw')
    u.is_staff = True
    u.save(update_fields=['is_staff'])
    return u


def _mutual_trade(a, b):
    album = Album.objects.create(name='M', slug='m', edition_year=2026, total_stickers=1)
    Sticker.objects.create(album=album, number='1', name='S')
    ua, ub = (a, b) if a.id < b.id else (b, a)
    match = Match.objects.create(user_a=ua, user_b=ub, channel=Match.Channel.SWIPE, status=Match.Status.MUTUAL)
    return Trade.objects.create(match=match, items=[], status=Trade.Status.COMPLETED)


# ---------------------------------------------------------------- create

@pytest.mark.django_db
def test_create_requires_authentication():
    assert APIClient().post(reverse('report-create'), {}, format='json').status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_report_a_user():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')

    resp = _client(a).post(reverse('report-create'), {
        'target_kind': 'user', 'target_id': b.id, 'reason': 'fake_profile', 'detail': 'parece bot',
    }, format='json')

    assert resp.status_code == status.HTTP_201_CREATED
    report = Report.objects.get()
    assert report.reporter_id == a.id
    assert report.target_user_id == b.id
    assert report.target_trade_id is None
    assert report.status == Report.Status.PENDING
    assert report.detail == 'parece bot'


@pytest.mark.django_db
def test_cannot_report_self():
    a = User.objects.create_user(email='a@example.com', password='pw')
    resp = _client(a).post(reverse('report-create'), {'target_kind': 'user', 'target_id': a.id, 'reason': 'other'}, format='json')
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert Report.objects.count() == 0


@pytest.mark.django_db
def test_report_a_trade_as_participant():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    trade = _mutual_trade(a, b)

    resp = _client(a).post(reverse('report-create'), {'target_kind': 'trade', 'target_id': trade.id, 'reason': 'no_show'}, format='json')

    assert resp.status_code == status.HTTP_201_CREATED
    report = Report.objects.get()
    assert report.target_trade_id == trade.id
    assert report.target_user_id is None
    assert report.reason == Report.Reason.NO_SHOW


@pytest.mark.django_db
def test_cannot_report_a_trade_you_are_not_part_of():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    outsider = User.objects.create_user(email='out@example.com', password='pw')
    trade = _mutual_trade(a, b)

    resp = _client(outsider).post(reverse('report-create'), {'target_kind': 'trade', 'target_id': trade.id, 'reason': 'no_show'}, format='json')

    assert resp.status_code == status.HTTP_403_FORBIDDEN
    assert Report.objects.count() == 0


@pytest.mark.django_db
def test_invalid_reason_is_rejected():
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    resp = _client(a).post(reverse('report-create'), {'target_kind': 'user', 'target_id': b.id, 'reason': 'banana'}, format='json')
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------- admin queue

@pytest.mark.django_db
def test_admin_list_requires_admin():
    plain = User.objects.create_user(email='p@example.com', password='pw')
    assert _client(plain).get(reverse('admin-report-list')).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_admin_list_returns_reports_and_filters():
    admin = _admin()
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    r1 = Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, target_user=b, reason=Report.Reason.HARASSMENT)
    trade = _mutual_trade(a, b)
    r2 = Report.objects.create(reporter=a, target_kind=Report.TargetKind.TRADE, target_trade=trade, reason=Report.Reason.NO_SHOW, status=Report.Status.DISMISSED)

    all_body = _client(admin).get(reverse('admin-report-list')).json()
    assert {r['id'] for r in all_body['results']} == {r1.id, r2.id}

    pending_body = _client(admin).get(reverse('admin-report-list'), {'status': 'pending'}).json()
    assert [r['id'] for r in pending_body['results']] == [r1.id]

    user_body = _client(admin).get(reverse('admin-report-list'), {'kind': 'user'}).json()
    assert [r['id'] for r in user_body['results']] == [r1.id]


# ---------------------------------------------------------------- resolve

@pytest.mark.django_db
def test_resolve_requires_admin():
    plain = User.objects.create_user(email='p@example.com', password='pw')
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    report = Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, target_user=b, reason=Report.Reason.OTHER)
    resp = _client(plain).patch(reverse('admin-report-resolve', args=[report.id]), {'status': 'dismissed'}, format='json')
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_resolve_sets_status_and_audit_fields():
    admin = _admin()
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    report = Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, target_user=b, reason=Report.Reason.OTHER)

    resp = _client(admin).patch(reverse('admin-report-resolve', args=[report.id]), {'status': 'actioned', 'resolution_notes': 'cuenta suspendida'}, format='json')

    assert resp.status_code == status.HTTP_200_OK
    report.refresh_from_db()
    assert report.status == Report.Status.ACTIONED
    assert report.resolved_by_id == admin.id
    assert report.resolved_at is not None
    assert report.resolution_notes == 'cuenta suspendida'


@pytest.mark.django_db
def test_resolve_rejects_invalid_status():
    admin = _admin()
    a = User.objects.create_user(email='a@example.com', password='pw')
    b = User.objects.create_user(email='b@example.com', password='pw')
    report = Report.objects.create(reporter=a, target_kind=Report.TargetKind.USER, target_user=b, reason=Report.Reason.OTHER)
    resp = _client(admin).patch(reverse('admin-report-resolve', args=[report.id]), {'status': 'pending'}, format='json')
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
