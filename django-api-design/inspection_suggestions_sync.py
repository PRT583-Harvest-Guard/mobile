"""
Django API Design for Inspection Suggestions Synchronization

This file outlines the Django models, serializers, views, and endpoints
for synchronizing inspection suggestions between the mobile app and the Django API.
"""

# Models
from django.db import models
from django.contrib.auth.models import User

class InspectionSuggestion(models.Model):
    """
    Model for storing inspection suggestions data.
    """
    target_entity = models.CharField(max_length=255)
    confidence_level = models.CharField(max_length=50)
    property_location = models.ForeignKey('Farm', on_delete=models.CASCADE, related_name='inspection_suggestions')
    area_size = models.FloatField()
    density_of_plant = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inspection_suggestions')
    
    # Sync-related fields
    mobile_id = models.IntegerField(unique=True, null=True, blank=True)
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
    
    class Meta:
        indexes = [
            models.Index(fields=['property_location']),
            models.Index(fields=['user']),
            models.Index(fields=['mobile_id']),
            models.Index(fields=['sync_status']),
        ]
    
    def __str__(self):
        return f"Inspection Suggestion {self.id} - {self.target_entity} - Farm {self.property_location_id}"


# Serializers
from rest_framework import serializers

class InspectionSuggestionSerializer(serializers.ModelSerializer):
    """
    Serializer for InspectionSuggestion model.
    """
    class Meta:
        model = InspectionSuggestion
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_synced', 'sync_status', 'user')


class InspectionSuggestionBulkSyncSerializer(serializers.Serializer):
    """
    Serializer for bulk syncing inspection suggestions.
    """
    inspection_suggestions = serializers.ListField(
        child=serializers.JSONField(),
        required=True
    )


# Views
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

class InspectionSuggestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for InspectionSuggestion model.
    """
    serializer_class = InspectionSuggestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return inspection suggestions for the authenticated user.
        """
        return InspectionSuggestion.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """
        Set the user when creating a new inspection suggestion.
        """
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def sync(self, request):
        """
        Sync inspection suggestions from the mobile app.
        
        This endpoint handles bulk creation, update, and deletion of inspection suggestions.
        It expects a list of inspection suggestions with mobile_id to identify them.
        """
        serializer = InspectionSuggestionBulkSyncSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        suggestions_data = serializer.validated_data['inspection_suggestions']
        
        # Track results
        created_count = 0
        updated_count = 0
        failed_count = 0
        results = []
        
        for suggestion_data in suggestions_data:
            try:
                # Extract mobile_id and farm_id
                mobile_id = suggestion_data.get('id')
                farm_id = suggestion_data.get('property_location')
                
                # Verify farm belongs to user
                farm = Farm.objects.filter(id=farm_id, user=request.user).first()
                if not farm:
                    results.append({
                        'mobile_id': mobile_id,
                        'status': 'failed',
                        'message': f'Farm with ID {farm_id} not found or does not belong to user'
                    })
                    failed_count += 1
                    continue
                
                # Check if suggestion exists
                suggestion = InspectionSuggestion.objects.filter(mobile_id=mobile_id).first()
                
                if suggestion:
                    # Update existing suggestion
                    for key, value in suggestion_data.items():
                        if key not in ['id', 'mobile_id', 'user']:
                            if key == 'property_location':
                                # Handle foreign key
                                suggestion.property_location = farm
                            else:
                                setattr(suggestion, key, value)
                    
                    suggestion.last_synced = timezone.now()
                    suggestion.sync_status = 'synced'
                    suggestion.save()
                    
                    # Update related observation points
                    self._update_observation_points(suggestion)
                    
                    results.append({
                        'mobile_id': mobile_id,
                        'server_id': suggestion.id,
                        'status': 'updated'
                    })
                    updated_count += 1
                else:
                    # Create new suggestion
                    new_suggestion_data = {k: v for k, v in suggestion_data.items() if k not in ['id', 'property_location', 'user']}
                    new_suggestion_data['property_location'] = farm
                    new_suggestion_data['user'] = request.user
                    new_suggestion_data['mobile_id'] = mobile_id
                    new_suggestion_data['last_synced'] = timezone.now()
                    new_suggestion_data['sync_status'] = 'synced'
                    
                    suggestion = InspectionSuggestion.objects.create(**new_suggestion_data)
                    
                    # Update related observation points
                    self._update_observation_points(suggestion)
                    
                    results.append({
                        'mobile_id': mobile_id,
                        'server_id': suggestion.id,
                        'status': 'created'
                    })
                    created_count += 1
            
            except Exception as e:
                results.append({
                    'mobile_id': suggestion_data.get('id'),
                    'status': 'failed',
                    'message': str(e)
                })
                failed_count += 1
        
        return Response({
            'status': 'success',
            'created': created_count,
            'updated': updated_count,
            'failed': failed_count,
            'results': results
        })
    
    def _update_observation_points(self, suggestion):
        """
        Update observation points related to this suggestion.
        
        When a suggestion is created or updated, we need to update the related
        observation points with the suggestion's target_entity and confidence_level.
        """
        from .observation_points_sync import ObservationPoint
        
        # Get all observation points for this farm
        observation_points = ObservationPoint.objects.filter(
            farm=suggestion.property_location
        )
        
        # Update them with the suggestion's data
        observation_points.update(
            inspection_suggestion=suggestion,
            target_entity=suggestion.target_entity,
            confidence_level=suggestion.confidence_level,
            last_synced=timezone.now(),
            sync_status='synced'
        )
    
    @action(detail=False, methods=['get'])
    def pending_sync(self, request):
        """
        Get inspection suggestions that need to be synced to the mobile app.
        
        This endpoint returns inspection suggestions that have been updated on the server
        since the last sync.
        """
        last_sync = request.query_params.get('last_sync')
        
        if last_sync:
            try:
                last_sync_time = timezone.datetime.fromisoformat(last_sync.replace('Z', '+00:00'))
                queryset = self.get_queryset().filter(updated_at__gt=last_sync_time)
            except ValueError:
                return Response(
                    {'error': 'Invalid last_sync format. Use ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # If no last_sync provided, return all inspection suggestions
            queryset = self.get_queryset()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# URLs
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'inspection-suggestions', InspectionSuggestionViewSet, basename='inspection-suggestion')

urlpatterns = [
    path('', include(router.urls)),
]
