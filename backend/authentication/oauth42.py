import os
from django.conf import settings
import requests

# Configuration OAuth 42
FT_UID = os.getenv('FT_UID')
FT_SECRET = os.getenv('FT_SECRET')
FT_REDIRECT_URI = settings.FT_REDIRECT_URI

# URLs de l'API 42
FT_AUTH_URL = "https://api.intra.42.fr/oauth/authorize"
FT_TOKEN_URL = "https://api.intra.42.fr/oauth/token"
FT_API_URL = "https://api.intra.42.fr/v2"

def get_42_auth_url():
    """Génère l'URL pour la redirection vers la page de login 42"""
    params = {
        'client_id': FT_UID,
        'redirect_uri': FT_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'public'  # On peut ajouter d'autres scopes si nécessaire
    }
    query_string = '&'.join(f'{key}={value}' for key, value in params.items())
    return f'{FT_AUTH_URL}?{query_string}'

async def get_42_token(code):
    """Échange le code d'autorisation contre un token d'accès"""
    data = {
        'grant_type': 'authorization_code',
        'client_id': FT_UID,
        'client_secret': FT_SECRET,
        'code': code,
        'redirect_uri': FT_REDIRECT_URI
    }
    response = requests.post(FT_TOKEN_URL, data=data)
    return response.json() if response.ok else None

async def get_42_user_info(access_token):
    """Récupère les informations de l'utilisateur avec le token"""
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(f'{FT_API_URL}/me', headers=headers)
    return response.json() if response.ok else None