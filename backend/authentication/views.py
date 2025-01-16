from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.db.models import Q
from .serializers import UserSerializer, FriendshipSerializer
from .models import Friendship, User
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from django.shortcuts import redirect
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .oauth42 import get_42_auth_url, FT_TOKEN_URL, FT_UID, FT_SECRET, FT_REDIRECT_URI, FT_API_URL
import requests
import json
import base64
import os
import logging
import bleach
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
import re

logger = logging.getLogger(__name__)

User = get_user_model()

@api_view(['GET'])
def test_headers(request):
    """Vue simple pour tester les en-têtes de sécurité"""
    response = JsonResponse({'message': 'Test headers'})
    return response

@api_view(['GET'])
@ensure_csrf_cookie  # Important pour le CSRF
def get_csrf_token(request):
    return JsonResponse({
        'csrfToken': get_token(request),
        'status': 'success'
    })

@api_view(['GET'])
def oauth42_login(request):
    """Redirige vers la page de login 42"""
    auth_url = get_42_auth_url()
    return Response({'auth_url': auth_url})

@api_view(['GET'])
def oauth42_callback(request):
    code = request.GET.get('code')
    if not code:
        return redirect('https://localhost:5500/?error=no_code')
    
    try:
        # Obtenir le token
        token_response = requests.post(FT_TOKEN_URL, data={
            'grant_type': 'authorization_code',
            'client_id': FT_UID,
            'client_secret': FT_SECRET,
            'code': code,
            'redirect_uri': FT_REDIRECT_URI
        })
        
        token_data = token_response.json()
        if 'access_token' not in token_data:
            return redirect('https://localhost:5500/?error=token_failed')
        
        # Get user info
        headers = {'Authorization': f'Bearer {token_data["access_token"]}'}
        user_response = requests.get(f'{FT_API_URL}/me', headers=headers)
        user_info = user_response.json()
        
        # Créer/mettre à jour l'utilisateur
        user, created = User.objects.get_or_create(
            username=user_info['login'],
            defaults={
                'email': user_info.get('email', ''),
            }
        )

        if not created:
            user.email = user_info.get('email', '')
            user.save()

        # Préparer les données utilisateur
        user_data = {
            'id': user.id,
            'username': user.username,
            'display_name': user.display_name,
            'email': user.email,
            'isLoggedIn': True,
            'token': token_data['access_token']
        }
        
        login(request, user)

        # Mettre à jour le statut en ligne
        user.is_online = True
        user.last_seen = timezone.now()
        user.save()

        # Assurer un JSON propre
        user_json = json.dumps(user_data, ensure_ascii=True)
        encoded_data = base64.b64encode(user_json.encode('utf-8')).decode('utf-8')
        response = redirect(f'https://localhost:5500/#auth={encoded_data}')
        
        return response
    
    except Exception as e:
        print("Error details:", str(e))
        import traceback
        traceback.print_exc()
        return redirect('https://localhost:5500/?error=authentication_failed')
        
@api_view(['POST'])
def register_api(request):
    print("Register API called with data:", request.data)  # Debug log
    
    if not request.data.get('password'):
        return Response(
            {'detail': 'Le mot de passe est requis.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer errors:", serializer.errors)  # Debug log
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except ValidationError as e:
        return Response(
            {'detail': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        return Response(
            {'detail': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

def sanitize_user_input(input_str):
    """Nettoie les entrées utilisateur"""
    if not isinstance(input_str, str):
        return input_str
    
    # Liste des balises HTML autorisées
    allowed_tags = ['p', 'br', 'strong', 'em']
    allowed_attributes = {}
    
    # Nettoyer avec bleach
    cleaned = bleach.clean(
        input_str,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True
    )
    return cleaned

@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@csrf_protect
def update_profile(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Not authenticated'}, 
                       status=status.HTTP_401_UNAUTHORIZED)

    try:
        data = request.data.copy()
        
        # Nettoyer les données
        display_name = data.get('display_name')
        if display_name:
            display_name = sanitize_user_input(display_name.strip())
        
        # Permettre un display_name null
        if not display_name:
            request.user.display_name = None
            request.user.save()
            return Response(UserSerializer(request.user).data)

        # Validation du display_name s'il est fourni
        if len(display_name) > 50:
            return Response({'detail': 'Display name too long'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        if not re.match(r'^[a-zA-Z0-9_\-\.]+$', display_name):
            return Response({'detail': 'Invalid display name format'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour l'utilisateur
        request.user.display_name = display_name
        request.user.save()
        
        return Response(UserSerializer(request.user).data)
        
    except ValidationError as e:
        return Response({'detail': str(e)}, 
                       status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return Response({'detail': str(e)}, 
                       status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def update_avatar(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    if 'avatar' not in request.FILES:
        return Response({'detail': 'No avatar file provided'}, status=status.HTTP_400_BAD_REQUEST)

    avatar = request.FILES['avatar']
    
    # Vérifier le type de fichier
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if avatar.content_type not in allowed_types:
        return Response({'detail': 'Invalid file type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Supprimer l'ancien avatar s'il existe
        if request.user.avatar:
            try:
                if os.path.isfile(request.user.avatar.path):
                    os.remove(request.user.avatar.path)
            except Exception as e:
                print(f"Error deleting old avatar: {e}")

        # Générer un nom de fichier unique
        ext = os.path.splitext(avatar.name)[1]
        filename = f'avatars/user_{request.user.id}_{os.urandom(8).hex()}{ext}'

        # Sauvegarder le nouveau fichier
        path = default_storage.save(filename, ContentFile(avatar.read()))
        request.user.avatar = path
        request.user.save()

        # Créer l'URL complète
        avatar_url = f"https://localhost:8000/media/{path}"

        # Retourner toutes les informations de l'utilisateur mises à jour
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'display_name': request.user.display_name,
            'avatar_url': avatar_url,
            'wins': request.user.wins,
            'losses': request.user.losses
        })
    except Exception as e:
        print(f"Error updating avatar: {str(e)}")
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def update_user_status(request):
    if request.user.is_authenticated:
        is_online = request.data.get('is_online', True)
        request.user.is_online = is_online
        request.user.last_seen = timezone.now()
        request.user.save()

        # Notifier les autres utilisateurs du changement de statut
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "users",
            {
                "type": "user_status",
                "user_id": str(request.user.id),
                "is_online": is_online,
                "timestamp": timezone.now().isoformat()
            }
        )
        return Response({'status': 'success'})
    return Response({'status': 'error'}, status=401)

@api_view(['POST'])
def logout_api(request):
    if request.user.is_authenticated:
        user_id = request.user.id
        channel_layer = get_channel_layer()
        
        try:
            # Mettre à jour le statut en hors ligne
            request.user.is_online = False
            request.user.save()

            # Envoyer la notification de déconnexion via WebSocket
            async_to_sync(channel_layer.group_send)(
                "users",
                {
                    "type": "user_status",
                    "user_id": str(user_id),
                    "is_online": False,
                    "timestamp": timezone.now().isoformat()
                }
            )
        except Exception as e:
            print(f"Error during logout: {e}")
        finally:
            # Si c'est une requête beacon (navigateur qui se ferme), ne pas vérifier le CSRF
            if request.headers.get('Content-Type') == 'text/plain;charset=UTF-8':
                logout(request)
            else:
                # Sinon, utiliser le comportement normal avec CSRF
                logout(request)
            
        return Response({'message': 'Successfully logged out'})
    
    return Response({'message': 'Not logged in'})

# Dans views.py
@api_view(['GET'])
def user_info(request):
    if not request.user.is_authenticated:
        response = Response(
            {'error': 'Not authenticated'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
        # Forcer l'ajout des en-têtes même en cas d'erreur
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
    
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
def search_users(request):
    """Version sécurisée de la recherche utilisateurs"""
    try:
        query = request.GET.get('query', '')
        if not query or len(query) > 50:
            return Response([], status=200)
        
        # Assainir la requête
        query = bleach.clean(query, strip=True)
        
        users = User.objects.filter(
            Q(username__icontains=query) | Q(display_name__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        # Sérialiser manuellement pour éviter les problèmes JSON
        user_data = [{
            'id': user.id,
            'username': str(user.username),
            'display_name': str(user.display_name) if user.display_name else str(user.username),
            'avatar_url': str(user.avatar.url) if user.avatar else None
        } for user in users]
        
        return Response(user_data, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
@api_view(['POST'])
def send_friend_request(request):
    """Envoyer une demande d'ami"""
    # Debug
    print("User authenticated:", request.user.is_authenticated)
    print("Current user:", request.user)
    
    if not request.user.is_authenticated:
        return Response(
            {'detail': 'User not authenticated'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    receiver_id = request.data.get('receiver_id')
    print("Received data:", request.data)
    print("Receiver ID:", receiver_id)
    
    try:
        receiver = User.objects.get(id=receiver_id)
        print("Found receiver:", receiver)
        
        # Vérifier qu'on n'envoie pas une demande à soi-même
        if receiver == request.user:
            return Response(
                {'detail': 'Cannot send friend request to yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si la demande existe déjà
        existing = Friendship.objects.filter(
            sender=request.user,
            receiver=receiver,
        ).exists()
        print("Existing friendship:", existing)
        
        if existing:
            return Response(
                {'detail': 'Friend request already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            # Vérifier si une demande inverse existe
        inverse_request = Friendship.objects.filter(
            sender=receiver,
            receiver=request.user
        ).first()

        if inverse_request:
            if inverse_request.status == 'pending':
                return Response(
                    {'detail': 'This user has already sent you a friend request'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif inverse_request.status == 'accepted':
                return Response(
                    {'detail': 'You are already friends'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        friendship, created = Friendship.objects.update_or_create(
            sender=request.user,
            receiver=receiver,
            defaults={'status': 'pending'}
        )
        return Response({'detail': 'Friend request sent'})
        
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
def handle_friend_request(request):
    """Accepter ou rejeter une demande d'ami"""
    friendship_id = request.data.get('friendship_id')
    action = request.data.get('action')  # 'accept' ou 'reject'
    
    try:
        friendship = Friendship.objects.get(
            id=friendship_id, 
            receiver=request.user,
            status='pending'
        )
        friendship.status = 'accepted' if action == 'accept' else 'rejected'
        friendship.save()
        return Response({'detail': f'Friend request {action}ed'})
    except Friendship.DoesNotExist:
        return Response({'detail': 'Friend request not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_friends(request):
    friendships = Friendship.objects.filter(
        (Q(sender=request.user) | Q(receiver=request.user)) &
        Q(status='accepted')
    )
        # Debug - voir toutes les amitiés
    all_friendships = Friendship.objects.filter(
        Q(sender=request.user) | Q(receiver=request.user)
    )
    print("All friendships:", [(f.sender.username, f.receiver.username, f.status) for f in all_friendships])

    friends = []
    for friendship in friendships:
        friend = friendship.receiver if friendship.sender == request.user else friendship.sender
        print(f"Friend {friend.username} online status: {friend.is_online}")  # Log de débogage
        friends.append({
            'id': friend.id,
            'username': friend.username,
            'display_name': friend.display_name,
            'avatar_url': friend.avatar_url if hasattr(friend, 'avatar_url') else None,
            'is_online': friend.is_online,
            'status': friendship.status
        })
    
    print("Returning friends:", friends)  # Log de débogage
    return Response(friends)

@api_view(['GET'])
def get_friend_requests(request):
    if not request.user.is_authenticated:
        return Response([])  # Retourne une liste vide si non authentifié
    """Obtenir les demandes d'ami en attente"""
    pending_requests = Friendship.objects.filter(
        receiver=request.user,
        status='pending'
    )
    return Response(FriendshipSerializer(pending_requests, many=True).data)

@api_view(['GET'])
def get_online_users(request):
    if not request.user.is_authenticated:
        return Response(status=status.HTTP_401_UNAUTHORIZED)
        
    online_users = User.objects.filter(
        Q(is_online=True) | 
        Q(last_seen__gte=timezone.now() - timezone.timedelta(minutes=5))
    )
    serializer = UserSerializer(online_users, many=True)
    return Response(serializer.data)

