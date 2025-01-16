from django.http import HttpResponseBadRequest, HttpResponse
import re

class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Si c'est une réponse HttpResponse ou similaire
        if isinstance(response, (HttpResponse, )):
            # Ajouter les en-têtes de sécurité
            response['X-Frame-Options'] = 'DENY'
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https://localhost:8000; "
                "connect-src 'self' ws://localhost:8000 https://localhost:8000"
            )
            
            # Ajouter Access-Control-Expose-Headers
            response['Access-Control-Expose-Headers'] = ', '.join([
                'X-Frame-Options',
                'X-XSS-Protection',
                'X-Content-Type-Options',
                'Content-Security-Policy'
            ])
            

        return response

class XSSProtectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'onerror=',
            r'onload=',
            r'eval\(',
            r'document\.cookie',
        ]

    def sanitize_input(self, value):
        if isinstance(value, str):
            value = value.replace('&', '&amp;')
            value = value.replace('<', '&lt;')
            value = value.replace('>', '&gt;')
            value = value.replace('"', '&quot;')
            value = value.replace("'", '&#x27;')
            return value
        return value

    def __call__(self, request):
        # Vérifier les paramètres GET
        for key, value in request.GET.items():
            if any(re.search(pattern, value, re.I) for pattern in self.xss_patterns):
                return HttpResponseBadRequest('Invalid input detected')
            request.GET = request.GET.copy()
            request.GET[key] = self.sanitize_input(value)

        # Vérifier les paramètres POST
        if hasattr(request, 'POST'):
            for key, value in request.POST.items():
                if isinstance(value, str) and any(re.search(pattern, value, re.I) for pattern in self.xss_patterns):
                    return HttpResponseBadRequest('Invalid input detected')
                request.POST = request.POST.copy()
                request.POST[key] = self.sanitize_input(value)

        return self.get_response(request)