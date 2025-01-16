from django.urls import path
from .views import *

urlpatterns = [
	path('api/start-game/', start_game, name = "start_game"),
	path('api/game-data/<int:game_id>/', game_data, name="game_data"),  # Ajout de cette ligne
	path('api/player-action/<int:game_id>/', player_action, name='player_action'),
    path('api/quit-game/<int:game_id>/', quit_game, name='quit_game'),  # Nouvelle route
    path('api/join-game/<int:game_id>/', join_online_game, name='join_online_game'),
    path('api/game-status/<int:game_id>/', check_game_status, name='check_game_status'),
    path('api/game-result/', update_game_result, name='game_result'),

]