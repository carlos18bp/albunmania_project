"""hCaptcha service tests."""
from unittest.mock import patch

import pytest
import requests
from django.test import override_settings

from albunmania_app.services.captcha_service import verify_hcaptcha


@pytest.mark.django_db
def test_returns_true_when_secret_is_empty():
    with override_settings(HCAPTCHA_SECRET='', RECAPTCHA_SECRET_KEY=''):
        assert verify_hcaptcha('any') is True


@pytest.mark.django_db
def test_returns_false_when_token_is_empty_with_secret_set():
    with override_settings(HCAPTCHA_SECRET='secret', RECAPTCHA_SECRET_KEY=''):
        assert verify_hcaptcha('') is False


@pytest.mark.django_db
def test_returns_true_when_provider_succeeds():
    class OkResp:
        status_code = 200

        def json(self):
            return {'success': True}

    with override_settings(HCAPTCHA_SECRET='secret'):
        with patch('albunmania_app.services.captcha_service.requests.post', return_value=OkResp()):
            assert verify_hcaptcha('valid') is True


@pytest.mark.django_db
def test_returns_false_when_provider_reports_failure():
    class FailResp:
        status_code = 200

        def json(self):
            return {'success': False, 'error-codes': ['invalid-input-response']}

    with override_settings(HCAPTCHA_SECRET='secret'):
        with patch('albunmania_app.services.captcha_service.requests.post', return_value=FailResp()):
            assert verify_hcaptcha('invalid') is False


@pytest.mark.django_db
def test_returns_false_on_network_exception():
    with override_settings(HCAPTCHA_SECRET='secret'):
        with patch(
            'albunmania_app.services.captcha_service.requests.post',
            side_effect=requests.RequestException,
        ):
            assert verify_hcaptcha('token') is False


@pytest.mark.django_db
def test_returns_false_on_non_200_status():
    class ErrResp:
        status_code = 500
        text = 'oops'

    with override_settings(HCAPTCHA_SECRET='secret'):
        with patch('albunmania_app.services.captcha_service.requests.post', return_value=ErrResp()):
            assert verify_hcaptcha('token') is False


@pytest.mark.django_db
def test_returns_false_on_non_json_body():
    class BadJsonResp:
        status_code = 200
        text = 'not json'

        def json(self):
            raise ValueError('not json')

    with override_settings(HCAPTCHA_SECRET='secret'):
        with patch('albunmania_app.services.captcha_service.requests.post', return_value=BadJsonResp()):
            assert verify_hcaptcha('token') is False


@pytest.mark.django_db
def test_falls_back_to_recaptcha_secret_when_hcaptcha_unset():
    class OkResp:
        status_code = 200

        def json(self):
            return {'success': True}

    with override_settings(HCAPTCHA_SECRET='', RECAPTCHA_SECRET_KEY='legacy-secret'):
        with patch('albunmania_app.services.captcha_service.requests.post', return_value=OkResp()) as mock_post:
            assert verify_hcaptcha('valid') is True
        mock_post.assert_called_once()
        assert mock_post.call_args.kwargs['data']['secret'] == 'legacy-secret'
