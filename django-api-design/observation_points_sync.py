"""
Django API Design for Observation Points Synchronization

This file outlines the Django models, serializers, views, and endpoints
for synchronizing observation points between the mobile app and the Django API.
"""

# Models
from django.db import models
from django.contrib.auth.models import User

class ObservationPoint(models.Model):
    """
    Model for storing observation points data.
    """
    farm = models.ForeignKey('Farm', on_delete=models.CASCADE, related_name='observation_points')
    latitude = models.FloatField()
    longitude = models.FloatField()
    observation_status = models.CharField(max_length=50, default='Nil')
    name = models.CharField(max_length=255, blank=True, null=True)
    segment = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    inspection_suggestion = models.ForeignKey(
        'InspectionSuggestion', 
        on_delete=models.SET_NULL, 
        related_name='observation_points', 
        null=True, 
        blank=True
    )
    confidence_level = models.CharField(max_length=50, blank=True, null=True)
    target_entity = models.CharField(max_length=255, blank=True, null=True)
    
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
            models.Index(fields=['farm']),
            models.Index(fields=['mobile_id']),
            models.Index(fields=['sync_status']),
        ]
    
    def __str__(self):
        return f"Observation Point {self.id} - Farm {self.farm_id} - Segment {self.segment}"


# Serializers
from rest_framework import serializers

class ObservationPointSerializer(serializers.ModelSerializer):
    """
    Serializer for ObservationPoint model.
    """
    class Meta:
        model = ObservationPoint
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_synced', 'sync_status')


class ObservationPointBulkSyncSerializer(serializers.Serializer):
    """
    Serializer for bulk syncing observation points.
    """
    observation_points = serializers.ListField(
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

class ObservationPointViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ObservationPoint model.
    """
    serializer_class = ObservationPointSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return observation points for the authenticated user.
        """
        return ObservationPoint.objects.filter(farm__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def sync(self, request):
        """
        Sync observation points from the mobile app.
        
        This endpoint handles bulk creation, update, and deletion of observation points.
        It expects a list of observation points with mobile_id to identify them.
        """
        serializer = ObservationPointBulkSyncSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        observation_points_data = serializer.validated_data['observation_points']
        
        # Track results
        created_count = 0
        updated_count = 0
        failed_count = 0
        results = []
        
        for point_data in observation_points_data:
            try:
                # Extract mobile_id and farm_id
                mobile_id = point_data.get('id')
                farm_id = point_data.get('farm_id')
                
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
                
                # Check if observation point exists
                point = ObservationPoint.objects.filter(mobile_id=mobile_id).first()
                
                if point:
                    # Update existing point
                    for key, value in point_data.items():
                        if key not in ['id', 'mobile_id']:
                            if key == 'farm_id':
                                # Handle foreign key
                                point.farm = farm
                            elif key == 'inspection_suggestion_id':
                                # Handle foreign key
                                suggestion = InspectionSuggestion.objects.filter(
                                    id=value, 
                                    property_location__user=request.user
                                ).first()
                                point.inspection_suggestion = suggestion
                            else:
                                setattr(point, key, value)
                    
                    point.last_synced = timezone.now()
                    point.sync_status = 'synced'
                    point.save()
                    
                    results.append({
                        'mobile_id': mobile_id,
                        'server_id': point.id,
                        'status': 'updated'
                    })
                    updated_count += 1
                else:
                    # Create new point
                    new_point_data = {k: v for k, v in point_data.items() if k not in ['id', 'farm_id', 'inspection_suggestion_id']}
                    new_point_data['farm'] = farm
                    new_point_data['mobile_id'] = mobile_id
                    
                    # Handle inspection suggestion if present
                    if 'inspection_suggestion_id' in point_data:
                        suggestion = InspectionSuggestion.objects.filter(
                            id=point_data['inspection_suggestion_id'], 
                            property_location__user=request.user
                        ).first()
                        if suggestion:
                            new_point_data['inspection_suggestion'] = suggestion
                    
                    new_point_data['last_synced'] = timezone.now()
                    new_point_data['sync_status'] = 'synced'
                    
                    point = ObservationPoint.objects.create(**new_point_data)
                    
                    results.append({
                        'mobile_id': mobile_id,
                        'server_id': point.id,
                        'status': 'created'
                    })
                    created_count += 1
            
            except Exception as e:
                results.append({
                    'mobile_id': point_data.get('id'),
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
    
    @action(detail=False, methods=['get'])
    def pending_sync(self, request):
        """
        Get observation points that need to be synced to the mobile app.
        
        This endpoint returns observation points that have been updated on the server
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
            # If no last_sync provided, return all observation points
            queryset = self.get_queryset()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# URLs
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'observation-points', ObservationPointViewSet, basename='observation-point')

urlpatterns = [
    path('', include(router.urls)),
]
