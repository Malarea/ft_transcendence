from functools import wraps
from django.http import JsonResponse
from django.conf import settings
import requests

def verify_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Vérifier l'authentification par token (42)
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            # Validation du token 42
            try:
                response = requests.get('https://api.intra.42.fr/v2/me', 
                    headers={'Authorization': f'Bearer {token}'})
                if response.status_code == 200:
                    return view_func(request, *args, **kwargs)
            except:
                pass

        # Si pas de token valide, vérifier l'authentification par session
        if request.user and request.user.is_authenticated:
            return view_func(request, *args, **kwargs)

        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return wrapper