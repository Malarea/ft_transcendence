# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from .models import User, Friendship
from pong.models import PongGame
from django.contrib.auth import get_user_model
from datetime import datetime

class UserStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.scope["user"].is_authenticated:
            await self.close()
            return

        self.user_id = str(self.scope["user"].id)
        self.group_name = "users"  # Ajout de cette ligne

        # Rejoindre le groupe
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Mettre à jour le statut et informer les autres
        await self.update_user_status(True)
        await self.broadcast_status(True)

        # Envoyer la liste des utilisateurs en ligne
        await self.send_online_users()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_id'):
            await self.update_user_status(False)
            await self.broadcast_status(False)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def broadcast_status(self, is_online):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "user_status",
                "user_id": self.user_id,
                "is_online": is_online,
                "timestamp": datetime.now().isoformat()
            }
        )

    async def user_status(self, event):
        try:
            await self.send(text_data=json.dumps({
                "type": "status_update",
                "user_id": event["user_id"],
                "is_online": event["is_online"],
                "timestamp": event["timestamp"]
            }))
        except Exception as e:
            # Si le protocole est fermé, ignorer silencieusement l'erreur
            if "closed protocol" not in str(e).lower():
                print(f"Error sending status update: {e}")

    @database_sync_to_async
    def update_user_status(self, status):
        User = get_user_model()
        try:
            user = User.objects.get(id=self.user_id)
            user.is_online = status
            user.last_seen = datetime.now()
            user.save(update_fields=['is_online', 'last_seen'])
            return True
        except User.DoesNotExist:
            return False

    @database_sync_to_async
    def get_online_users(self):
        User = get_user_model()
        online_users = User.objects.filter(is_online=True).values('id', 'username', 'display_name')
        return list(online_users)

    async def send_online_users(self):
        online_users = await self.get_online_users()
        await self.send(text_data=json.dumps({
            "type": "online_users",
            "users": online_users
        }))

    @database_sync_to_async
    def update_paddle_position(self, game_id, player, action, speed):
        try:
            game = PongGame.objects.get(id=game_id)
            # Calculer un multiplicateur de vitesse basé sur le delta time (environ 16ms)
            speed = speed * 0.8  # Ajustement pour un mouvement plus fluide
            
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
            
            # Arrondir les positions pour éviter les décimales inutiles
            game.left_paddle_y = round(game.left_paddle_y)
            game.right_paddle_y = round(game.right_paddle_y)
            
            game.save(update_fields=['left_paddle_y', 'right_paddle_y'])
        except PongGame.DoesNotExist:
            pass
