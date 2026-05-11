from django.urls import path

from albunmania_app.views.stats import stats_me, stats_ranking

urlpatterns = [
    path('stats/me/', stats_me, name='stats-me'),
    path('stats/ranking/', stats_ranking, name='stats-ranking'),
]
