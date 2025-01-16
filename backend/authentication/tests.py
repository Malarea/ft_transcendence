from django.test import TestCase
from django.test import TestCase, Client
from django.urls import reverse

class SecurityTests(TestCase):
    def setUp(self):
        self.client = Client()
        
    def test_xss_search(self):
        xss_payloads = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(\'XSS\')">',
            '<svg onload=alert("XSS")>',
        ]
        
        for payload in xss_payloads:
            response = self.client.get(
                reverse('search_users'), 
                {'query': payload}
            )
            self.assertNotContains(response, payload)
            
    def test_csrf_protection(self):
        response = self.client.post(
            reverse('update_profile'),
            {'display_name': 'test'},
            HTTP_X_CSRF_TOKEN='invalid'
        )
        self.assertEqual(response.status_code, 403)

    def test_sql_injection(self):
            dangerous_queries = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' UNION SELECT username, password FROM users; --"
            ]
            
            for query in dangerous_queries:
                response = self.client.get(
                    reverse('search_users'), 
                    {'query': query}
                )
                self.assertEqual(response.status_code, 200)

    def test_security_headers(self):
        response = self.client.get(reverse('home'))
        
        self.assertEqual(
            response['X-Frame-Options'], 
            'DENY'
        )
        self.assertEqual(
            response['X-Content-Type-Options'], 
            'nosniff'
        )
        self.assertEqual(
            response['X-XSS-Protection'], 
            '1; mode=block'
        )
        self.assertTrue('Content-Security-Policy' in response)