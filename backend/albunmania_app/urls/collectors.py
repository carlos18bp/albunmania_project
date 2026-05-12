from django.urls import path

from albunmania_app.views.collectors import collectors_map, collectors_search

urlpatterns = [
    path('collectors/map/', collectors_map, name='collectors-map'),
    path('collectors/search/', collectors_search, name='collectors-search'),
]
