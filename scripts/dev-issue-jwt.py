"""Emit a Playwright storage-state JSON pre-loaded with a valid JWT.

Used by the local validation sessions to skip the (broken) Google
OAuth flow without touching app code.

Usage:
    cd backend && source venv/bin/activate
    python ../scripts/dev-issue-jwt.py user@example.com \
        > ../.playwright_local/sessions/user.json

The output is a Playwright `storageState` object; load it with
`browser_set_storage_state` (or `BrowserContext.addInitScript` /
`storageState` option) to start the browser already authenticated.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def _bootstrap_django() -> None:
    backend_dir = Path(__file__).resolve().parent.parent / 'backend'
    sys.path.insert(0, str(backend_dir))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'albunmania_project.settings')
    import django  # noqa: WPS433 — late import after sys.path fixup
    django.setup()


def main() -> int:
    if len(sys.argv) < 2:
        print('usage: dev-issue-jwt.py <email> [origin]', file=sys.stderr)
        return 2

    email = sys.argv[1]
    origin = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:3000'

    _bootstrap_django()
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import RefreshToken

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f'user not found: {email}', file=sys.stderr)
        return 1

    refresh = RefreshToken.for_user(user)
    # The frontend stores JWTs in cookies (`access_token`, `refresh_token`)
    # via `lib/services/tokens.ts` — NOT in localStorage. The helper has
    # to mirror that to be picked up by the Authorization header
    # interceptor in `lib/services/http.ts`.
    from urllib.parse import urlparse
    parsed = urlparse(origin)
    domain = parsed.hostname or 'localhost'
    state = {
        'cookies': [
            {
                'name': 'access_token',
                'value': str(refresh.access_token),
                'domain': domain,
                'path': '/',
                'sameSite': 'Lax',
                'httpOnly': False,
                'secure': False,
            },
            {
                'name': 'refresh_token',
                'value': str(refresh),
                'domain': domain,
                'path': '/',
                'sameSite': 'Lax',
                'httpOnly': False,
                'secure': False,
            },
        ],
        'origins': [{'origin': origin, 'localStorage': []}],
    }
    json.dump(state, sys.stdout, indent=2)
    sys.stdout.write('\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
