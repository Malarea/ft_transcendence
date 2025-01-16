from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_api, name='register'),
    path('login/', views.login_api, name='login'),
    path('logout/', views.logout_api, name='logout'),
    path('user/', views.user_info, name='user_info'),
    path('update_profile/', views.update_profile, name='update_profile'),
    path('update_avatar/', views.update_avatar, name='update_avatar'),
    path('csrf/', views.get_csrf_token, name='csrf'),
    path('register/', views.register_api, name='register'),
    path('search-users/', views.search_users, name='search_users'),
    path('send-friend-request/', views.send_friend_request, name='send_friend_request'),
    path('handle-friend-request/', views.handle_friend_request, name='handle_friend_request'),
    path('friends/', views.get_friends, name='get_friends'),
    path('friend-requests/', views.get_friend_requests, name='get_friend_requests'),
    path('online-users/', views.get_online_users, name='online_users'),
    path('42/login/', views.oauth42_login, name='oauth42_login'),
    path('42/callback', views.oauth42_callback, name='oauth42_callback'),
    path('update-status/', views.update_user_status, name='update_user_status'),
    path('test-headers/', views.test_headers, name='test_headers'),
]