from django.urls import path

from albunmania_app.views.review import (
    admin_review_reports,
    admin_review_visibility,
    review_edit,
    review_reply,
    review_report,
    trade_review_create,
    user_rating_summary,
    user_reviews_list,
)

urlpatterns = [
    path('trades/<int:trade_id>/reviews/', trade_review_create, name='trade-review-create'),
    path('reviews/<int:review_id>/', review_edit, name='review-edit'),
    path('reviews/<int:review_id>/reply/', review_reply, name='review-reply'),
    path('reviews/<int:review_id>/report/', review_report, name='review-report'),
    path('users/<int:user_id>/reviews/', user_reviews_list, name='user-reviews-list'),
    path('users/<int:user_id>/rating-summary/', user_rating_summary, name='user-rating-summary'),
    path('admin/reviews/reports/', admin_review_reports, name='admin-review-reports'),
    path(
        'admin/reviews/<int:review_id>/visibility/',
        admin_review_visibility, name='admin-review-visibility',
    ),
]
