import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import PongGame

class PongConsumer(AsyncWebsocketConsumer):
    matchmaking_queue = []

    async def connect(self):
        self.game_id = None
        self.game_group_name = None
        self.game_task = None
        self.in_queue = False
        self.player_side = None
        await self.accept()

    async def disconnect(self, close_code):
        if self.game_id:
            # Informer les autres joueurs de la déconnexion
            await self.channel_layer.group_send(
                f'game_{self.game_id}',
                {
                    'type': 'player_disconnected',
                    'message': {
                        'type': 'player_disconnected',
                        'player_side': self.player_side
                    }
                }
            )
    
        # Logique existante de déconnexion
        if self.in_queue and self in PongConsumer.matchmaking_queue:
            PongConsumer.matchmaking_queue.remove(self)
            self.in_queue = False

        if self.game_task:
            self.game_task.cancel()
            self.game_task = None
        
        if self.game_group_name:
            await self.channel_layer.group_discard(
                self.game_group_name,
                self.channel_name
            )
        
        if self.game_id:
            await self.update_game_status(self.game_id, False)

    async def player_disconnected(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def receive(self, text_data):
            try:
                data = json.loads(text_data)
                message_type = data.get('type')

                if message_type == 'join_queue':
                    print("Handling join queue request")
                    await self.handle_join_queue()
                elif message_type == 'leave_queue':
                    await self.handle_leave_queue()
                elif message_type == 'join_game':
                    await self.handle_join_game(data)
                elif message_type == 'player_action':
                    await self.handle_player_action(data)

            except json.JSONDecodeError:
                print("Invalid JSON received")
            except Exception as e:
                print(f"Error processing message: {str(e)}")

    async def handle_join_game(self, data):
        try:
            self.game_id = data['game_id']
            self.player_side = data.get('player_side')
            self.game_group_name = f'game_{self.game_id}'
            
            print(f"Player joining game: {self.game_id} as {self.player_side}")
            
            await self.channel_layer.group_add(
                self.game_group_name,
                self.channel_name
            )

            game = await self.get_game(self.game_id)
            if game:
                self.game_task = asyncio.create_task(self.game_loop())

        except Exception as e:
            print(f"Error in handle_join_game: {str(e)}")
    
    async def handle_leave_queue(self):
        if self.in_queue:
            PongConsumer.matchmaking_queue.remove(self)
            self.in_queue = False

    async def game_loop(self):
        last_update = time.time()
        update_interval = 1 / 60  # 60 FPS
        
        try:
            while True:
                current_time = time.time()
                elapsed = current_time - last_update

                game = await self.get_game(self.game_id)
                if not game or not game.is_active:
                    break

                # Mise à jour de la position de la balle uniquement
                if elapsed >= update_interval:
                    await self.update_game_position(game, update_interval)
                    last_update = current_time

                # Envoi de l'état actuel
                await self.send_game_state(game)
                await asyncio.sleep(0.016)  # ~60 FPS

        except Exception as e:
            print(f"Error in game loop: {str(e)}")
        finally:
            self.game_task = None

    @database_sync_to_async
    def get_game(self, game_id):
        try:
            return PongGame.objects.get(id=game_id)
        except PongGame.DoesNotExist:
            return None

    @database_sync_to_async
    def update_game_position(self, game, delta_time):
        game.update_position(delta_time)
        game.save()

    @database_sync_to_async
    def update_game_status(self, game_id, is_active):
        try:
            game = PongGame.objects.get(id=game_id)
            game.is_active = is_active
            game.save()
        except PongGame.DoesNotExist:
            print(f"Game {game_id} not found")
            pass

    async def handle_player_action(self, data):
        try:
            if not self.game_id:
                return

            action = data.get('action')
            player = data.get('player')
            
            # Mise à jour directe de la position de la raquette sans envoyer d'état
            await self.update_paddle_position(self.game_id, player, action, 15)

        except Exception as e:
            print(f"Error in handle_player_action: {str(e)}")

    @database_sync_to_async
    def create_online_game(self):
        from .models import PongGame
        game = PongGame.objects.create(
            is_active=True,
            is_online=True
        )
        return game

    @database_sync_to_async
    def update_paddle_position(self, game_id, player, action, speed):
        try:
            game = PongGame.objects.get(id=game_id)
            if player == 'left':
                if action == 'moove_up':
                    game.left_paddle_y = max(game.left_paddle_y - speed, 0)
                elif action == 'moove_down':
                    game.left_paddle_y = min(game.left_paddle_y + speed, 500)
            elif player == 'right':
                if action == 'moove_up':
                    game.right_paddle_y = max(game.right_paddle_y - speed, 0)
                elif action == 'moove_down':
                    game.right_paddle_y = min(game.right_paddle_y + speed, 500)
            game.save()
        except PongGame.DoesNotExist:
            pass

    async def send_game_state(self, game):
        game_state = {
            'type': 'game_update',
            'data': {
                'ball': {'x': game.ball_x, 'y': game.ball_y},
                'leftPaddle': {'y': game.left_paddle_y},
                'rightPaddle': {'y': game.right_paddle_y},
                'score': {'left': game.left_score, 'right': game.right_score}
            }
        }
        # Envoyer l'état à tous les clients connectés à cette partie
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'game_message',
                'message': game_state
            }
        )

    async def game_message(self, event):
        # Envoyer le message au WebSocket
        await self.send(text_data=json.dumps(event['message']))

    async def handle_join_queue(self):
        print("Player joining queue")  # Debug log

        if not self.in_queue:
            self.in_queue = True
            PongConsumer.matchmaking_queue.append(self)
            print(f"Queue size: {len(PongConsumer.matchmaking_queue)}")  # Debug log

            if len(PongConsumer.matchmaking_queue) >= 2:
                print("Found enough players, creating game")  # Debug log
                
                player1 = PongConsumer.matchmaking_queue.pop(0)
                player2 = PongConsumer.matchmaking_queue.pop(0)

                try:
                    game = await self.create_online_game()
                    game_id = game.id
                    print(f"Created game with ID: {game_id}")  # Debug log

                    # Player 1 sera à gauche, Player 2 à droite
                    player1.player_side = 'left'
                    player2.player_side = 'right'

                    # Informer les joueurs
                    await player1.send(json.dumps({
                        'type': 'game_found',
                        'game_id': game_id,
                        'player_side': 'left'
                    }))

                    await player2.send(json.dumps({
                        'type': 'game_found',
                        'game_id': game_id,
                        'player_side': 'right'
                    }))

                    # Initialiser les joueurs
                    player1.in_queue = False
                    player2.in_queue = False
                except Exception as e:
                    print(f"Error creating game: {str(e)}")
                    if player1.in_queue:
                        PongConsumer.matchmaking_queue.append(player1)
                    if player2.in_queue:
                        PongConsumer.matchmaking_queue.append(player2)