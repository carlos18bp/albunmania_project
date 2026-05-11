from django.urls import include, path

urlpatterns = [
    path('', include('albunmania_app.urls.auth')),
    path('', include('albunmania_app.urls.blog')),
    path('', include('albunmania_app.urls.product')),
    path('', include('albunmania_app.urls.sale')),
]