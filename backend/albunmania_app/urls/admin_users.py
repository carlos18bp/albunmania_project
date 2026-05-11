from django.urls import path

from albunmania_app.views.admin_users import (
    admin_user_assign_role,
    admin_user_set_active,
    admin_users_list,
)

urlpatterns = [
    path('admin/users/', admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/role/', admin_user_assign_role, name='admin-user-role'),
    path('admin/users/<int:user_id>/active/', admin_user_set_active, name='admin-user-active'),
]
