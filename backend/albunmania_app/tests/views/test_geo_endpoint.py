"""IP geolocation endpoint (GeoIP2) — graceful when the DB is absent."""
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from albunmania_app.services import geoip


@pytest.fixture(autouse=True)
def _reset_geoip_reader_cache():
    # The reader is process-cached; reset it around each test.
    geoip._reader = None
    geoip._reader_loaded = False
    yield
    geoip._reader = None
    geoip._reader_loaded = False


@pytest.mark.django_db
def test_returns_unavailable_when_no_geoip_db_configured(settings):
    settings.GEOIP_PATH = ''

    body = APIClient().get(reverse('geo-ip-locate')).json()

    assert body == {'available': False, 'source': 'geoip'}


@pytest.mark.django_db
def test_returns_location_for_a_public_ip(settings):
    settings.GEOIP_PATH = '/tmp/fake-GeoLite2-City.mmdb'

    fake_resp = MagicMock()
    fake_resp.location.latitude = 4.65
    fake_resp.location.longitude = -74.07
    fake_resp.city.name = 'Bogotá'
    fake_resp.country.iso_code = 'CO'
    fake_reader = MagicMock()
    fake_reader.city.return_value = fake_resp

    with patch('os.path.exists', return_value=True), \
         patch('geoip2.database.Reader', return_value=fake_reader):
        res = APIClient().get(reverse('geo-ip-locate'), HTTP_X_FORWARDED_FOR='200.116.10.10')

    assert res.status_code == status.HTTP_200_OK
    body = res.json()
    assert body['available'] is True and body['located'] is True
    assert body['lat'] == 4.65 and body['lng'] == -74.07
    assert body['city'] == 'Bogotá' and body['country'] == 'CO'


@pytest.mark.django_db
def test_private_ip_is_not_located(settings):
    settings.GEOIP_PATH = '/tmp/fake-GeoLite2-City.mmdb'
    fake_reader = MagicMock()

    with patch('os.path.exists', return_value=True), \
         patch('geoip2.database.Reader', return_value=fake_reader):
        body = APIClient().get(reverse('geo-ip-locate'), REMOTE_ADDR='127.0.0.1').json()

    assert body == {'available': True, 'located': False, 'source': 'geoip'}
    fake_reader.city.assert_not_called()


@pytest.mark.django_db
def test_address_not_found_is_handled(settings):
    settings.GEOIP_PATH = '/tmp/fake-GeoLite2-City.mmdb'
    fake_reader = MagicMock()
    fake_reader.city.side_effect = Exception('AddressNotFoundError')

    with patch('os.path.exists', return_value=True), \
         patch('geoip2.database.Reader', return_value=fake_reader):
        body = APIClient().get(reverse('geo-ip-locate'), HTTP_X_FORWARDED_FOR='8.8.8.8').json()

    assert body == {'available': True, 'located': False, 'source': 'geoip'}
