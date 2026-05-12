"""IP-based geolocation (GeoIP2 / MaxMind) — the "IP" half of the dual
geolocation feature; the browser geolocation API is the precise half.

The MaxMind GeoLite2-City `.mmdb` is **not** shipped in the repo (licensing +
size). Ops drop the file on the server and point `settings.GEOIP_PATH` (env
`DJANGO_GEOIP_PATH`) at it — see deploy/staging. When the DB is absent every
lookup returns `None` and the feature degrades gracefully (the onboarding
wizard just falls back to asking for browser geolocation).
"""
from __future__ import annotations

import ipaddress
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

# Module-level cache so we open the .mmdb at most once per process.
_reader = None
_reader_loaded = False


def _get_reader():
    global _reader, _reader_loaded
    if _reader_loaded:
        return _reader
    _reader_loaded = True
    path = getattr(settings, 'GEOIP_PATH', '') or ''
    if not path:
        return None
    try:
        import os

        import geoip2.database

        if not os.path.exists(path):
            logger.info('GeoIP2: DB not found at %s — IP geolocation disabled', path)
            return None
        _reader = geoip2.database.Reader(path)
    except Exception:  # pragma: no cover - defensive: bad file / missing dep
        logger.exception('GeoIP2: failed to open the database; IP geolocation disabled')
        _reader = None
    return _reader


def available() -> bool:
    """True if the GeoIP2 database is configured and loadable."""
    return _get_reader() is not None


def client_ip(request) -> str | None:
    """Best-effort client IP — first hop in X-Forwarded-For, else REMOTE_ADDR."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        first = xff.split(',')[0].strip()
        if first:
            return first
    return request.META.get('REMOTE_ADDR') or None


def _is_public(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved)


def locate_ip(ip: str | None) -> dict | None:
    """Resolve `ip` to `{lat, lng, city, country}` or `None` (no DB / private IP / no data)."""
    if not ip or not _is_public(ip):
        return None
    reader = _get_reader()
    if reader is None:
        return None
    try:
        resp = reader.city(ip)
    except Exception:  # geoip2.errors.AddressNotFoundError and friends
        return None
    if resp.location.latitude is None or resp.location.longitude is None:
        return None
    return {
        'lat': float(resp.location.latitude),
        'lng': float(resp.location.longitude),
        'city': resp.city.name or '',
        'country': resp.country.iso_code or '',
    }
