from .models import PongGame

def find_or_create_game(player):
	game = PongGame.objects.filter(right_actif=False, is_active=True).first() #verifie si une game existe deja

	if game:#si elle existe la rejoins
		game.player_right = player
		game.right_actif = True
		player_side = 'right'
		game.save()

	else:
		game = PongGame.objects.create(player_left=player, is_active=True)#si non cree une game
		# game.is_active = True
		player_side = 'left'
	return game, player_side