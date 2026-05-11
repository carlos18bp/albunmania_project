from django.urls import include, path

urlpatterns = [
    path('', include('albunmania_app.urls.auth')),
    path('google-captcha/', include('albunmania_app.urls.captcha')),
    path('', include('albunmania_app.urls.user')),
]
