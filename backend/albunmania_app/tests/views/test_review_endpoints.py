"""Review endpoints — create, edit, reply, list, summary, report, moderate."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from albunmania_app.models import Album, Match, Review, ReviewReport, Sticker, Trade


User = get_user_model()


@pytest.fixture
def trade(db):
    a = User.objects.create_user(email='a@x.com', password='pw')
    b = User.objects.create_user(email='b@x.com', password='pw')
    album = Album.objects.create(name='M26', slug='m26', edition_year=2026, total_stickers=10)
    s1 = Sticker.objects.create(album=album, number='1', name='S1')
    match = Match.objects.create(user_a=a, user_b=b, channel=Match.Channel.SWIPE)
    t = Trade.objects.create(match=match, items=[
        {'from_user': a.id, 'to_user': b.id, 'sticker_id': s1.id},
    ])
    return {'a': a, 'b': b, 'trade': t}


@pytest.mark.django_db
def test_create_review_persists_and_aggregates(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    res = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {
        'stars': 5, 'comment': 'Excelente', 'tags': ['puntual'],
    }, format='json')
    assert res.status_code == 201
    trade['b'].profile.refresh_from_db()
    assert trade['b'].profile.rating_count == 1


@pytest.mark.django_db
def test_create_rejects_unknown_tags(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    res = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {
        'stars': 5, 'tags': ['pirata'],
    }, format='json')
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_rejects_outsider(trade):
    outsider = User.objects.create_user(email='o@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=outsider)
    res = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 5}, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_create_returns_409_on_duplicate(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 5}, format='json')
    res = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 4}, format='json')
    assert res.status_code == 409


@pytest.mark.django_db
def test_edit_within_window_updates_review(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    create = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 5}, format='json')
    review_id = create.json()['id']

    res = client.patch(f'/api/reviews/{review_id}/', {'stars': 3}, format='json')
    assert res.status_code == 200
    Review.objects.get(pk=review_id).stars == 3


@pytest.mark.django_db
def test_edit_blocked_after_window(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    create = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 5}, format='json')
    review_id = create.json()['id']
    Review.objects.filter(pk=review_id).update(created_at=timezone.now() - timedelta(hours=25))

    res = client.patch(f'/api/reviews/{review_id}/', {'stars': 3}, format='json')
    assert res.status_code == 403


@pytest.mark.django_db
def test_reviewee_can_reply_once(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    create = client.post(f"/api/trades/{trade['trade'].id}/reviews/", {'stars': 5}, format='json')
    review_id = create.json()['id']

    client.force_authenticate(user=trade['b'])
    res = client.post(f'/api/reviews/{review_id}/reply/', {'reply': 'Gracias!'}, format='json')
    assert res.status_code == 200

    # Second reply rejected
    res = client.post(f'/api/reviews/{review_id}/reply/', {'reply': 'Otra'}, format='json')
    assert res.status_code == 409


@pytest.mark.django_db
def test_public_list_filters_by_stars_and_visibility(trade):
    Review.objects.create(trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=5)

    client = APIClient()
    res = client.get(f"/api/users/{trade['b'].id}/reviews/?stars=5")
    assert res.status_code == 200
    assert res.json()['total'] == 1


@pytest.mark.django_db
def test_rating_summary_returns_distribution_and_top_tags(trade):
    Review.objects.create(
        trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'],
        stars=5, tags=['puntual', 'amable'],
    )
    client = APIClient()
    res = client.get(f"/api/users/{trade['b'].id}/rating-summary/")
    assert res.status_code == 200
    body = res.json()
    assert body['distribution']['5'] == 1
    assert any(t['tag'] == 'puntual' for t in body['top_tags'])


@pytest.mark.django_db
def test_report_creates_pending_row(trade):
    review = Review.objects.create(
        trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=1,
    )
    reporter = User.objects.create_user(email='rep@x.com', password='pw')
    client = APIClient()
    client.force_authenticate(user=reporter)
    res = client.post(f'/api/reviews/{review.id}/report/', {'reason': 'spam'}, format='json')
    assert res.status_code == 201
    assert ReviewReport.objects.filter(review=review).count() == 1


@pytest.mark.django_db
def test_admin_visibility_toggle_hides_review_and_resolves_reports(trade):
    admin = User.objects.create_user(email='ad@x.com', password='pw')
    admin.assign_role(User.Role.ADMIN)
    review = Review.objects.create(
        trade=trade['trade'], reviewer=trade['a'], reviewee=trade['b'], stars=1,
    )
    reporter = User.objects.create_user(email='rep@x.com', password='pw')
    ReviewReport.objects.create(review=review, reporter=reporter, reason='spam')

    client = APIClient()
    client.force_authenticate(user=admin)
    res = client.patch(
        f'/api/admin/reviews/{review.id}/visibility/',
        {'is_visible': False, 'resolution_notes': 'spam confirmed'},
        format='json',
    )
    assert res.status_code == 200

    review.refresh_from_db()
    assert review.is_visible is False
    assert ReviewReport.objects.filter(review=review, status='actioned').count() == 1


@pytest.mark.django_db
def test_admin_endpoints_reject_non_admin(trade):
    client = APIClient()
    client.force_authenticate(user=trade['a'])
    assert client.get('/api/admin/reviews/reports/').status_code == 403
