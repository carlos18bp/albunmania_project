from django.urls import include, path

urlpatterns = [
    path('', include('albunmania_app.urls.auth')),
    path('captcha/', include('albunmania_app.urls.captcha')),
    # Backwards-compat alias for the original reCAPTCHA-era prefix.
    path('google-captcha/', include('albunmania_app.urls.captcha')),
    path('', include('albunmania_app.urls.user')),
    path('', include('albunmania_app.urls.profile')),
    path('', include('albunmania_app.urls.album')),
    path('', include('albunmania_app.urls.inventory')),
    path('', include('albunmania_app.urls.sponsor')),
    path('', include('albunmania_app.urls.match')),
    path('', include('albunmania_app.urls.trade')),
    path('', include('albunmania_app.urls.trade_whatsapp')),
    path('', include('albunmania_app.urls.stats')),
    path('', include('albunmania_app.urls.merchant')),
    path('', include('albunmania_app.urls.ad')),
]
