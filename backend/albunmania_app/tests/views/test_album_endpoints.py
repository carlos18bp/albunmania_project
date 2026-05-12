"""Album catalogue + sticker filter / search endpoints."""
import pytest
from django.urls import reverse
from rest_framework import status

from albunmania_app.models import Album, Sticker


@pytest.fixture
def m26(db):
    return Album.objects.create(
        name='Mundial 26', slug='mundial-26', edition_year=2026, total_stickers=670,
    )


@pytest.fixture
def stickers(db, m26):
    Sticker.objects.create(album=m26, number='1', name='Mbappé', team='Francia',
                           is_special_edition=True, special_tier='gold')
    Sticker.objects.create(album=m26, number='2', name='Lionel Messi', team='Argentina')
    Sticker.objects.create(album=m26, number='00', name='Lámina cero', team='Especial',
                           is_special_edition=True, special_tier='zero')
    return None


@pytest.mark.django_db
def test_album_list_returns_only_active(api_client, m26):
    Album.objects.create(name='Inactivo', slug='inactivo', edition_year=2024, is_active=False)

    response = api_client.get(reverse('album-list'))

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]['slug'] == 'mundial-26'


@pytest.mark.django_db
def test_album_detail_returns_404_for_unknown_slug(api_client):
    response = api_client.get(reverse('album-detail', args=['unknown']))
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_album_detail_returns_404_for_inactive(api_client):
    Album.objects.create(name='Inactivo', slug='inactivo', edition_year=2024, is_active=False)
    response = api_client.get(reverse('album-detail', args=['inactivo']))
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_sticker_list_returns_paginated(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']))
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['count'] == 3
    assert len(body['results']) == 3


@pytest.mark.django_db
def test_sticker_list_filters_by_team(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']) + '?team=Argentina')
    assert response.json()['count'] == 1
    assert response.json()['results'][0]['team'] == 'Argentina'


@pytest.mark.django_db
def test_sticker_list_filters_special_only(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']) + '?special=1')
    assert response.json()['count'] == 2


@pytest.mark.django_db
def test_sticker_list_special_accepts_truthy_strings(api_client, m26, stickers):
    """Frontend sends `special=true`; backend must honour it (was: only `special=1`)."""
    for value in ('true', 'TRUE', 'yes', '1'):
        response = api_client.get(
            reverse('album-stickers', args=['mundial-26']) + f'?special={value}'
        )
        assert response.json()['count'] == 2, f'special={value!r} should match 2'


@pytest.mark.django_db
def test_sticker_list_special_false_excludes_special(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']) + '?special=false')
    body = response.json()
    assert body['count'] == 1  # only Messi
    assert body['results'][0]['name'] == 'Lionel Messi'


@pytest.mark.django_db
def test_sticker_list_filters_by_special_tier(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']) + '?special_tier=zero')
    assert response.json()['count'] == 1
    assert response.json()['results'][0]['number'] == '00'


@pytest.mark.django_db
def test_sticker_list_filters_by_q_text(api_client, m26, stickers):
    response = api_client.get(reverse('album-stickers', args=['mundial-26']) + '?q=Messi')
    assert response.json()['count'] == 1


@pytest.mark.django_db
def test_sticker_search_requires_min_2_chars(api_client, m26, stickers):
    response = api_client.get(reverse('album-search', args=['mundial-26']) + '?q=M')
    assert response.json() == {'results': []}


@pytest.mark.django_db
def test_sticker_search_returns_top_10(api_client, m26, stickers):
    response = api_client.get(reverse('album-search', args=['mundial-26']) + '?q=Mb')
    assert len(response.json()['results']) == 1
    assert response.json()['results'][0]['name'] == 'Mbappé'
