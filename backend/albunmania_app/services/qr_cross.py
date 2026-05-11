"""Pure inventory-crossing logic shared between server and (TS port) client.

Given two inventories `[{sticker_id, count}, ...]`, compute which
stickers each side could give to the other. The function is pure (no DB
access, no IO) so it can be:

  - Run server-side as a sanity check before persisting a `qr_presencial`
    Match (so a malicious client cannot fabricate items the user does
    not actually own).
  - Mirrored byte-for-byte in TypeScript for the offline cross executed
    in the PWA when a Bluetooth/network is unavailable.

`count` semantics match `UserSticker`:
  - 0 = missing (would receive)
  - 1 = pasted (in the album, NOT available to give away)
  - 2+ = repeated (extras → can give away)
"""
from __future__ import annotations

from typing import TypedDict


class InventoryEntry(TypedDict):
    sticker_id: int
    count: int


class CrossSide(TypedDict):
    sticker_id: int


class CrossResult(TypedDict):
    a_to_b: list[CrossSide]
    b_to_a: list[CrossSide]


def _index(inv: list[InventoryEntry]) -> dict[int, int]:
    """Collapse a list of entries to a `{sticker_id: count}` map.

    Duplicates collapse by taking the max count — the spec is
    last-write-wins but for safety we don't trust order here.
    """
    result: dict[int, int] = {}
    for entry in inv:
        sid = entry['sticker_id']
        c = entry['count']
        if c < 0:
            continue
        result[sid] = max(result.get(sid, 0), c)
    return result


def compute_offline_cross(
    user_a_inventory: list[InventoryEntry],
    user_b_inventory: list[InventoryEntry],
) -> CrossResult:
    """Return the symmetric trade plan between A and B.

    A can give a sticker S to B when:
      - A has count(S) >= 2 (a repeated)
      - B has count(S) == 0 (missing)

    The output is deterministic (sorted by sticker_id) so the result is
    stable across server/client and easy to compare in tests.
    """
    a = _index(user_a_inventory)
    b = _index(user_b_inventory)

    a_to_b: list[CrossSide] = []
    b_to_a: list[CrossSide] = []

    for sid, count in a.items():
        if count >= 2 and b.get(sid, 0) == 0:
            a_to_b.append({'sticker_id': sid})

    for sid, count in b.items():
        if count >= 2 and a.get(sid, 0) == 0:
            b_to_a.append({'sticker_id': sid})

    a_to_b.sort(key=lambda x: x['sticker_id'])
    b_to_a.sort(key=lambda x: x['sticker_id'])

    return {'a_to_b': a_to_b, 'b_to_a': b_to_a}
