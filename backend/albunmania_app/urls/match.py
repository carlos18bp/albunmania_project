from django.urls import path

from albunmania_app.views.match import (
    match_detail,
    match_feed,
    match_like,
    match_mine,
    qr_confirm,
    qr_me,
    qr_scan,
)

urlpatterns = [
    path('match/feed/', match_feed, name='match-feed'),
    path('match/like/', match_like, name='match-like'),
    path('match/mine/', match_mine, name='match-mine'),
    path('match/qr/me/', qr_me, name='match-qr-me'),
    path('match/qr/scan/', qr_scan, name='match-qr-scan'),
    path('match/qr/confirm/', qr_confirm, name='match-qr-confirm'),
    path('match/<int:match_id>/', match_detail, name='match-detail'),
]
