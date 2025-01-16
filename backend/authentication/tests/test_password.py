# backend/authentication/tests/test_password.py

from django.test import TestCase
from django.core.exceptions import ValidationError
from ..models import validate_password_strength
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordValidationTests(TestCase):
    def test_valid_password(self):
        # Devrait passer
        validate_password_strength("TestPass123!")
        
    def test_password_too_short(self):
        # Devrait échouer
        with self.assertRaises(ValidationError):
            validate_password_strength("Tp1!")
            
    def test_password_no_uppercase(self):
        with self.assertRaises(ValidationError):
            validate_password_strength("testpass123!")
            
    def test_password_no_lowercase(self):
        with self.assertRaises(ValidationError):
            validate_password_strength("TESTPASS123!")
            
    def test_password_no_number(self):
        with self.assertRaises(ValidationError):
            validate_password_strength("TestPassWord!")
            
    def test_password_no_special(self):
        with self.assertRaises(ValidationError):
            validate_password_strength("TestPass123")
            
    def test_user_registration(self):
        # Test l'enregistrement d'un utilisateur avec un mot de passe valide
        user = User.objects.create_user(
            username="testuser",
            password="TestPass123!"
        )
        self.assertTrue(user.check_password("TestPass123!"))