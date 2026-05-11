from django.urls import path

from albunmania_app.views.ad import (
    ad_admin_campaign_detail,
    ad_admin_campaigns,
    ad_admin_stats,
    ads_click,
    ads_serve,
)

urlpatterns = [
    path('ads/serve/', ads_serve, name='ads-serve'),
    path('ads/click/<int:impression_id>/', ads_click, name='ads-click'),
    path('ads/admin/campaigns/', ad_admin_campaigns, name='ads-admin-campaigns'),
    path(
        'ads/admin/campaigns/<int:campaign_id>/',
        ad_admin_campaign_detail, name='ads-admin-campaign-detail',
    ),
    path(
        'ads/admin/campaigns/<int:campaign_id>/stats/',
        ad_admin_stats, name='ads-admin-stats',
    ),
]
