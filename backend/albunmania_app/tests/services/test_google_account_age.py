"""Tests for the Google People API account-age verification."""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
import requests
from django.test import override_settings

from albunmania_app.services.google_account_age import (
    MIN_ACCOUNT_AGE_DAYS,
    verify_account_age,
)


def _people_response(create_time_iso: str, status_code: int = 200):
    class Resp:
        def __init__(self):
            self.status_code = status_code
            self.text = ''

        def json(self):
            return {
                'metadata': {
                    'sources': [
                        {'createTime': create_time_iso},
                    ],
                },
            }

    return Resp()


def _iso_n_days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat().replace('+00:00', 'Z')


@pytest.mark.django_db
@override_settings(DEBUG=False)
def test_returns_false_when_access_token_missing_in_production():
    ok, age = verify_account_age('')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_bypass_when_access_token_missing_in_debug():
    ok, age = verify_account_age('')

    assert ok is True
    assert age == -1


@pytest.mark.django_db
def test_returns_true_for_account_older_than_min_days():
    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=_people_response(_iso_n_days_ago(365)),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is True
    assert age >= MIN_ACCOUNT_AGE_DAYS


@pytest.mark.django_db
def test_returns_false_for_account_younger_than_min_days():
    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=_people_response(_iso_n_days_ago(5)),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert 0 <= age < MIN_ACCOUNT_AGE_DAYS


@pytest.mark.django_db
def test_returns_false_on_request_exception():
    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        side_effect=requests.RequestException,
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_returns_false_on_non_200_status():
    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=_people_response('', status_code=401),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_returns_false_when_create_time_missing():
    class NoCreateTime:
        status_code = 200
        text = ''

        def json(self):
            return {'metadata': {'sources': [{}]}}

    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=NoCreateTime(),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_returns_false_when_metadata_sources_empty():
    class EmptyMeta:
        status_code = 200
        text = ''

        def json(self):
            return {'metadata': {'sources': []}}

    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=EmptyMeta(),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_returns_false_when_create_time_is_malformed():
    """A non-empty but unparseable createTime is treated as missing."""
    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=_people_response('not-a-real-timestamp'),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_returns_false_on_non_json_body():
    class NonJson:
        status_code = 200
        text = '<html>not json</html>'

        def json(self):
            raise ValueError('No JSON object could be decoded')

    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=NonJson(),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is False
    assert age == -1


@pytest.mark.django_db
def test_uses_the_earliest_create_time_across_sources():
    class MultiSource:
        status_code = 200
        text = ''

        def json(self):
            return {'metadata': {'sources': [
                {'createTime': _iso_n_days_ago(10)},   # too young on its own
                {'createTime': _iso_n_days_ago(400)},  # the earliest → should be used
            ]}}

    with patch(
        'albunmania_app.services.google_account_age.requests.get',
        return_value=MultiSource(),
    ):
        ok, age = verify_account_age('access-token')

    assert ok is True
    assert age >= MIN_ACCOUNT_AGE_DAYS
