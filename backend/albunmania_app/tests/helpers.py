"""
Test helper utilities shared across multiple test modules.

These are utility functions (not fixtures) that provide common
data-building or response-parsing operations reused in tests.

Albunmanía-specific factories (Album, Sticker, UserSticker, Match, Trade,
Review, Sponsor, etc.) will be added here as their epics land in Bloque B.
"""
from django_attachments.models import Library


def get_paginated_results(response_data):
    """
    Extract results list from a DRF PageNumberPagination response.

    Args:
        response_data: The parsed JSON body of a paginated API response.

    Returns:
        list: The 'results' array, or the original data if not paginated.
    """
    if isinstance(response_data, dict) and 'results' in response_data:
        return response_data['results']
    return response_data


def make_library(title='Test Library'):
    """
    Create and return a Library instance for gallery fields.

    Args:
        title: Human-readable label for the library.

    Returns:
        Library: The created Library instance.
    """
    return Library.objects.create(title=title)
