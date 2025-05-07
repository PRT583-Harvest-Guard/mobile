"""
Django API Design for User Profile Synchronization

This file outlines the Django models, serializers, views, and endpoints
for synchronizing user profiles between the mobile app and the Django API.
"""

# Models
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    """
    Extended user profile model.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    company = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Sync-related fields
    last_synced = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('synced', 'Synced'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    def __str__(self):
        return f"Profile for {self.user.username}"


# Create a UserProfile for each new User
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


# Serializers
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_synced', 'sync_status')


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating UserProfile.
    """
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    
    class Meta:
        model = UserProfile
        fields = (
            'first_name', 'last_name', 'email', 'phone_number', 
            'bio', 'company', 'job_title', 'address'
        )
    
    def update(self, instance, validated_data):
        # Update User model fields
        user = instance.user
        if 'first_name' in validated_data:
            user.first_name = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            user.last_name = validated_data.pop('last_name')
        if 'email' in validated_data:
            user.email = validated_data.pop('email')
        user.save()
        
        # Update UserProfile fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_new_password(self, value):
        validate_password(value)
        return value


class ProfilePictureSerializer(serializers.ModelSerializer):
    """
    Serializer for updating profile picture.
    """
    class Meta:
        model = UserProfile
        fields = ('profile_picture',)


# Views
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UserProfile model.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return the profile for the authenticated user.
        """
        return UserProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        """
        Get the profile for the authenticated user.
        """
        return self.request.user.profile
    
    def list(self, request, *args, **kwargs):
        """
        Return the profile for the authenticated user.
        """
        profile = self.get_object()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], serializer_class=UserProfileUpdateSerializer)
    def update_profile(self, request):
        """
        Update the user profile.
        """
        profile = self.get_object()
        serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Update sync status
            profile.last_synced = timezone.now()
            profile.sync_status = 'synced'
            profile.save()
            
            return Response(UserProfileSerializer(profile).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], serializer_class=ChangePasswordSerializer)
    def change_password(self, request):
        """
        Change the user password.
        """
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': ['Wrong password.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'status': 'password set'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=False, 
        methods=['post'], 
        serializer_class=ProfilePictureSerializer,
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload_picture(self, request):
        """
        Upload a profile picture.
        """
        profile = self.get_object()
        serializer = ProfilePictureSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Update sync status
            profile.last_synced = timezone.now()
            profile.sync_status = 'synced'
            profile.save()
            
            return Response(UserProfileSerializer(profile).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def sync(self, request):
        """
        Sync the user profile from the mobile app.
        
        This endpoint returns the latest profile data from the server.
        """
        profile = self.get_object()
        
        # Update last_synced timestamp
        profile.last_synced = timezone.now()
        profile.sync_status = 'synced'
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


# URLs
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
]
