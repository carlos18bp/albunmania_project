"""wa.me deep link generation.

The deep link is constructed server-side so the message template stays
under our control (rather than being a client-side string the user can
tamper with). The other party's phone number is sourced from their
`Profile.whatsapp_e164`; if missing or empty, no link can be built and
the caller receives `None`.

The template is intentionally short (WhatsApp truncates long
prefilled messages on some platforms) and lists only sticker numbers,
not full names — keeps the link well under the practical 200-char
limit.
"""
from __future__ import annotations

from urllib.parse import quote

from albunmania_app.models import Profile, Sticker, Trade


def _format_sticker_list(sticker_ids: list[int]) -> str:
    if not sticker_ids:
        return '—'
    stickers = list(
        Sticker.objects.filter(id__in=sticker_ids).values('number', 'name')[:25]
    )
    if not stickers:
        return '—'
    parts = [f"#{s['number']}" for s in stickers]
    return ', '.join(parts)


def _build_message(trade: Trade, viewer_id: int, peer_id: int) -> str:
    """Plain text message, viewer-centric ("Yo te doy / Yo busco")."""
    gives = [it['sticker_id'] for it in trade.items if it['from_user'] == viewer_id]
    receives = [it['sticker_id'] for it in trade.items if it['to_user'] == viewer_id]

    return (
        f"Hola! Soy de Albunmanía, hicimos match (#{trade.match_id}). "
        f"Yo te doy: {_format_sticker_list(gives)}. "
        f"Yo busco: {_format_sticker_list(receives)}. "
        f"¿Cuándo coordinamos?"
    )


def build_whatsapp_link(trade: Trade, viewer_id: int) -> str | None:
    """Return the wa.me URL for the *peer's* number, viewed by `viewer_id`.

    The viewer always opens WhatsApp pointing at the *other* participant.
    Returns `None` when the peer has not provided a `whatsapp_e164`.
    """
    pair = trade.participant_ids
    if viewer_id not in pair:
        return None
    peer_id = pair[1] if pair[0] == viewer_id else pair[0]

    peer_profile = Profile.objects.filter(user_id=peer_id).first()
    if not peer_profile or not peer_profile.whatsapp_e164:
        return None

    phone = ''.join(c for c in peer_profile.whatsapp_e164 if c.isdigit())
    if not phone:
        return None

    text = _build_message(trade, viewer_id, peer_id)
    return f'https://wa.me/{phone}?text={quote(text)}'
