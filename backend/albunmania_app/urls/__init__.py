from django.urls import include, path

urlpatterns = [
    path('', include('albunmania_app.urls.auth')),
    path('google-captcha/', include('albunmania_app.urls.captcha')),
    path('', include('albunmania_app.urls.blog')),
    path('', include('albunmania_app.urls.product')),
    path('', include('albunmania_app.urls.sale')),
    path('', include('albunmania_app.urls.user')),
    path('', include('albunmania_app.urls.staging_phase_banner')),
]
