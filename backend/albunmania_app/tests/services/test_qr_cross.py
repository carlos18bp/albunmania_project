"""qr_cross service — symmetric, deterministic offline cross."""
import pytest

from albunmania_app.services.qr_cross import compute_offline_cross


def test_empty_inventories_return_empty_cross():
    assert compute_offline_cross([], []) == {'a_to_b': [], 'b_to_a': []}


def test_no_cross_when_no_repeats():
    a = [{'sticker_id': 1, 'count': 1}]
    b = [{'sticker_id': 1, 'count': 0}]
    assert compute_offline_cross(a, b) == {'a_to_b': [], 'b_to_a': []}


def test_a_can_give_repeated_to_missing_b():
    a = [{'sticker_id': 5, 'count': 3}]
    b = [{'sticker_id': 5, 'count': 0}]
    cross = compute_offline_cross(a, b)
    assert cross['a_to_b'] == [{'sticker_id': 5}]
    assert cross['b_to_a'] == []


def test_symmetric_swap():
    a = [{'sticker_id': 1, 'count': 2}, {'sticker_id': 2, 'count': 0}]
    b = [{'sticker_id': 1, 'count': 0}, {'sticker_id': 2, 'count': 2}]
    cross = compute_offline_cross(a, b)
    assert cross['a_to_b'] == [{'sticker_id': 1}]
    assert cross['b_to_a'] == [{'sticker_id': 2}]


def test_pasted_sticker_is_not_offered():
    a = [{'sticker_id': 9, 'count': 1}]
    b = [{'sticker_id': 9, 'count': 0}]
    assert compute_offline_cross(a, b) == {'a_to_b': [], 'b_to_a': []}


def test_results_are_sorted_by_sticker_id():
    a = [{'sticker_id': 3, 'count': 2}, {'sticker_id': 1, 'count': 2}]
    b = [{'sticker_id': 3, 'count': 0}, {'sticker_id': 1, 'count': 0}]
    cross = compute_offline_cross(a, b)
    assert [c['sticker_id'] for c in cross['a_to_b']] == [1, 3]
