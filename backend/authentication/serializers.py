# authentication/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship, validate_password_strength
from django.core.exceptions import ValidationError

User = get_user_model()

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    online_status = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=True)

    def validate_password(self, value):
        try:
            validate_password_strength(value)
            return value
        except ValidationError as e:
            raise serializers.ValidationError(str(e))

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'display_name', 
                 'avatar_url', 'wins', 'losses', 'is_online', 'online_status', 
                 'last_seen')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False},
            'display_name': {'required': False}
        }

    def get_online_status(self, obj):
        return {
            'is_online': obj.is_online,
            'is_recently_online': obj.is_recently_online,
            'last_seen': obj.last_seen
        }

    def get_avatar_url(self, obj):
        if obj.avatar:
            return f"https://localhost:8000/media/{obj.avatar}"
        return None
    
    def validate(self, data):
        password = data.get('password')
        print(f"Validating password in serializer: {bool(password)}")  # Debug log
        
        try:
            if not password:
                raise ValidationError('Le mot de passe est requis.')
            validate_password_strength(password)
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        
        return data

    def create(self, validated_data):
        try:
            password = validated_data.pop('password')
            print(f"Creating user with password: {bool(password)}")  # Debug log
            
            user = User.objects.create_user(
                password=password,
                **validated_data
            )
            return user
        except Exception as e:
            print(f"Error creating user: {str(e)}")  # Debug log
            raise

class FriendshipSerializer(serializers.ModelSerializer):
    sender_info = UserSerializer(source='sender', read_only=True)
    receiver_info = UserSerializer(source='receiver', read_only=True)

    class Meta:
        model = Friendship
        fields = ('id', 'sender_info', 'receiver_info', 'status', 'created_at', 'updated_at')