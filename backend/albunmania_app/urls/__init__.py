from django.urls import include, path

urlpatterns = [
    path('', include('albunmania_app.urls.auth')),
    path('captcha/', include('albunmania_app.urls.captcha')),
    # Backwards-compat alias for the original reCAPTCHA-era prefix.
    path('google-captcha/', include('albunmania_app.urls.captcha')),
    path('', include('albunmania_app.urls.user')),
    path('', include('albunmania_app.urls.profile')),
]
