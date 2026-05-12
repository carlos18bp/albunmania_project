"""
Authentication views — Google OAuth login + JWT token validation.

The product authenticates exclusively through Google OAuth (with hCaptcha and
the "Google account older than 30 days" rule); there is no email/password
sign-up flow. `validate_token` is also the place where `Profile.last_seen`
gets refreshed for presence.
"""
import logging

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from albunmania_app.services.captcha_service import verify_hcaptcha
from albunmania_app.services.google_account_age import (
    MIN_ACCOUNT_AGE_DAYS,
    verify_account_age,
)
from albunmania_app.utils.auth_utils import generate_auth_tokens

User = get_user_model()

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Google OAuth login endpoint.

    Expected data:
    - credential / id_token: Google ID token
    - access_token: Google access token (used for the People API age check)
    - captcha_token: hCaptcha token
    - email / given_name / family_name / picture: fallbacks if the token can't be validated
    """
    credential = request.data.get('credential') or request.data.get('id_token')

    if not credential:
        return Response({'error': 'Google credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    email = request.data.get('email', '').strip().lower()
    given_name = request.data.get('given_name', '').strip()
    family_name = request.data.get('family_name', '').strip()
    picture_url = request.data.get('picture', '')

    payload = None
    aud_mismatch = False
    try:
        tokeninfo = requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': credential},
            timeout=5,
        )
        if tokeninfo.status_code == 200:
            payload = tokeninfo.json()
        else:
            logger.warning('Google tokeninfo rejected credential: status=%s body=%s', tokeninfo.status_code, tokeninfo.text)
    except (requests.RequestException, ValueError) as exc:
        logger.warning('Google token validation failed: %s', exc)

    if payload is not None:
        aud = payload.get('aud', '')
        allowed_auds = [v.strip() for v in (settings.GOOGLE_OAUTH_CLIENT_ID or '').split(',') if v.strip()]
        if allowed_auds and aud not in allowed_auds:
            logger.warning('Google aud mismatch. aud=%s allowed=%s', aud, allowed_auds)
            aud_mismatch = True
            payload = None

    if payload is None and not settings.DEBUG:
        if aud_mismatch:
            return Response({'error': 'Invalid Google client'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Invalid Google credential'}, status=status.HTTP_401_UNAUTHORIZED)

    if payload is not None:
        token_email = (payload.get('email') or '').strip().lower()
        if token_email:
            email = token_email

        token_given = (payload.get('given_name') or '').strip()
        token_family = (payload.get('family_name') or '').strip()
        token_picture = payload.get('picture') or ''

        if token_given:
            given_name = token_given
        if token_family:
            family_name = token_family
        if token_picture:
            picture_url = token_picture

    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # hCaptcha verification (Albunmanía spec — applies on first ingress).
    captcha_token = request.data.get('captcha_token', '')
    if not verify_hcaptcha(captcha_token):
        logger.info('Google login rejected: hCaptcha verification failed.')
        return Response(
            {'error': 'captcha_failed', 'detail': 'hCaptcha verification failed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Account age rule: only Google accounts older than MIN_ACCOUNT_AGE_DAYS
    # are allowed to register / sign in. We only enforce on account creation
    # (returning users keep working even if the People API call fails later).
    access_token = request.data.get('access_token', '')
    user_already_exists = User.objects.filter(email=email).exists()

    if not user_already_exists:
        is_old_enough, age_days = verify_account_age(access_token)
        if not is_old_enough:
            logger.info(
                'Google sign-up rejected for %s: account too young (age_days=%s).',
                email, age_days,
            )
            return Response(
                {
                    'error': 'account_too_young',
                    'min_days': MIN_ACCOUNT_AGE_DAYS,
                    'account_age_days': age_days,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': given_name,
            'last_name': family_name,
            'is_active': True,
        }
    )

    if created:
        user.set_unusable_password()
        user.save(update_fields=['password'])

    # Update names if user exists but doesn't have them
    if not created:
        if not user.first_name and given_name:
            user.first_name = given_name
        if not user.last_name and family_name:
            user.last_name = family_name
        if user.first_name or user.last_name:
            user.save()

    # Generate tokens
    tokens = generate_auth_tokens(user)
    tokens['created'] = created
    tokens['google_validated'] = payload is not None

    return Response(tokens, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token(request):
    """Validate the JWT and return the current user; also refreshes presence."""
    user = request.user
    from albunmania_app.services import presence
    presence.touch(user)
    return Response({
        'valid': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_200_OK)
