from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordHashTests(TestCase):
    def test_password_is_argon2(self):
        # Créer un utilisateur test
        user = User.objects.create_user(
            username="hashtest",
            password="TestPass123!"
        )
        # Vérifier que le hash commence par 'argon2'
        self.assertTrue(user.password.startswith('argon2'))
        
    def test_password_verification(self):
        # Vérifier que l'authentification fonctionne
        user = User.objects.create_user(
            username="hashtest2",
            password="TestPass123!"
        )
        self.assertTrue(user.check_password("TestPass123!"))
        self.assertFalse(user.check_password("WrongPass123!"))