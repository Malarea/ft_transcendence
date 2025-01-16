#routing.py de Transcendance


from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from authentication import routing as auth_routing
from pong import routing as pong_routing

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(
            auth_routing.websocket_urlpatterns + pong_routing.websocket_urlpatterns
        )
    ),
})