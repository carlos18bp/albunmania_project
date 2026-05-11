from django.urls import path

from albunmania_app.views.album import (
    album_detail,
    album_list,
    sticker_list,
    sticker_search,
)

urlpatterns = [
    path('albums/', album_list, name='album-list'),
    path('albums/<slug:slug>/', album_detail, name='album-detail'),
    path('albums/<slug:slug>/stickers/', sticker_list, name='album-stickers'),
    path('albums/<slug:slug>/search/', sticker_search, name='album-search'),
]
