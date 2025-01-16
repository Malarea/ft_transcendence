from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
import re

def validate_password_strength(password):
    errors = []
    try:
        # Vérification de base
        if not password or len(str(password).strip()) == 0:
            errors.append('Le mot de passe est requis.')
            raise ValidationError(errors)

        # Vérifications de sécurité
        if len(password) < 8:
            errors.append('Le mot de passe doit contenir au moins 8 caractères.')
        if not re.search(r'[A-Z]', password):
            errors.append('Le mot de passe doit contenir au moins une majuscule.')
        if not re.search(r'[a-z]', password):
            errors.append('Le mot de passe doit contenir au moins une minuscule.')
        if not re.search(r'[0-9]', password):
            errors.append('Le mot de passe doit contenir au moins un chiffre.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Le mot de passe doit contenir au moins un caractère spécial.')

        if errors:
            raise ValidationError(errors)

    except Exception as e:
        print(f"Validation error: {str(e)}")
        raise

    return True

class User(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    display_name = models.CharField(max_length=50, unique=True, null=True, blank=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.display_name or self.username

    def save(self, *args, **kwargs):
        if self._state.adding:  # Si c'est une nouvelle instance
            if self.password:
                validate_password_strength(self.password)
        if self._state.adding and not self.display_name:
            self.display_name = None

        super().save(*args, **kwargs)

    @property
    def is_recently_online(self):
        if self.is_online:
            return True
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).seconds < 300  # 5 minutes

class Friendship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    )

    sender = models.ForeignKey(User, related_name='sent_friendships', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_friendships', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')