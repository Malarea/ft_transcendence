from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from time import sleep
import json
from django.http import StreamingHttpResponse
from .models import *
from .game_service import find_or_create_game 
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated

# Create your views here.

def home(request):
    return render(request, 'index.html')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_game(request):
    try:
        game = PongGame.objects.create(is_active=True)
        return Response({
            "game_id": game.id,
            "message": "Game started successfully"
        })
    except Exception as e:
        print(f"Error creating game: {str(e)}")  # Debug log
        return Response({"error": str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_online_game(request, game_id):
    try:
        game = PongGame.objects.get(id=game_id)
        user = request.user
        
        # Vérifie si la partie est en ligne
        if game.game_type != 'online':
            return Response({"error": "This is not an online game"}, status=400)
            
        # Vérifie si la partie a déjà deux joueurs
        if game.player_left and game.player_right:
            return Response({"error": "Game is full"}, status=400)
            
        # Assigne le joueur à une position libre
        if not game.player_left:
            game.player_left = user
            game.left_actif = True
            side = 'left'
        elif not game.player_right:
            game.player_right = user
            game.right_actif = True
            side = 'right'
            
            # Si les deux joueurs sont présents, active la partie
            game.is_active = True
            
        game.save()
        
        return Response({
            "game_id": game.id,
            "side": side,
            "message": "Successfully joined game"
        })
        
    except PongGame.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_game_status(request, game_id):
    try:
        game = PongGame.objects.get(id=game_id)
        return Response({
            "game_id": game.id,
            "is_active": game.is_active,
            "game_type": game.game_type,
            "left_player": game.player_left.username if game.player_left else None,
            "right_player": game.player_right.username if game.player_right else None,
        })
    except PongGame.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)

@api_view(['POST'])
def quit_game(request, game_id):
    try:
        game = PongGame.objects.get(id=game_id)
        game.is_active = False
        game.save()
        return Response({"status": "success"})
    except PongGame.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_game_result(request):
    try:
        game_id = request.data.get('game_id')
        won = request.data.get('won')
        
        game = PongGame.objects.get(id=game_id)
        user = request.user

        if won:
            user.wins += 1
        else:
            user.losses += 1
        user.save()

        return Response({'status': 'success'})
    except PongGame.DoesNotExist:
        return Response({'error': 'Game not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
def player_action(request, game_id):

    try:
        game = PongGame.objects.get(id=game_id)
    except PongGame.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)

    action = request.data.get('action')
    player = request.data.get('player')

    if not action or not player:
        return Response({"error": "Missing 'action' or 'player'"}, status=400)


    if player == 'left':
        if action == 'moove_up':
            game.left_paddle_y = max(game.left_paddle_y - 10, 0)
        elif action == 'moove_down':
            game.left_paddle_y = min(game.left_paddle_y + 10, 500)
    elif player == 'right':
        if action == 'moove_up':
            game.right_paddle_y = max(game.right_paddle_y - 10, 0)
        elif action == 'moove_down':
            game.right_paddle_y = min(game.right_paddle_y + 10, 500)
    
    game.save()
    return Response({"message": "Action Received"})

def game_data(request, game_id):
    """
    Envoie des mises à jour en temps réel pour un jeu spécifique via SSE.
    """
    try:
        game = PongGame.objects.get(id=game_id)
    except PongGame.DoesNotExist:
        return StreamingHttpResponse("Game not found", status=404)

    def event_stream():
        while True:
            # Mise à jour de l'état du jeu
            game.refresh_from_db()
            game.update_position()
            game.save()

            # Préparation des données à envoyer
            data = {
                'ball': {'x': game.ball_x, 'y': game.ball_y},
                'left_paddle': {'y': game.left_paddle_y},
                'right_paddle': {'y': game.right_paddle_y},
                'score': {'left': game.left_score, 'right': game.right_score}
            }

            # Envoi des données au client
            yield f"data: {json.dumps(data)}\n\n"

            # Délai avant la prochaine mise à jour (fréquence d'envoi)
            sleep(1 / 60)  # 60 FPS

    # Configuration de la réponse en streaming
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Important pour certains serveurs comme Nginx
    return response
