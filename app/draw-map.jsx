import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import MapView, { Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { PageHeader, CustomButton } from '@/components';
import { getFarms, saveBoundaryData, deleteAllBoundaryPoints } from '@/services/BoundaryService';
import useBoundaryStore from '@/store/boundaryStore';

const DrawMapScreen = () => {
  const { farmId } = useLocalSearchParams();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);
  const boundaryStore = useBoundaryStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load farm data
        const farms = await getFarms();
        const farmData = farms.find(f => f.id === Number(farmId) || f.id === farmId);
        
        if (!farmData) {
          Alert.alert('Error', 'Farm not found');
          router.back();
          return;
        }
        
        setFarm(farmData);
        boundaryStore.setFarmId(farmData.id);
        
        // Get current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to use this feature');
          // Set default region (Australia)
          setInitialRegion({
            latitude: -25.2744,
            longitude: 133.7751,
            latitudeDelta: 25,
            longitudeDelta: 25,
          });
        } else {
          const location = await Location.getCurrentPositionAsync({});
          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        
        // Load existing boundary points
        await boundaryStore.loadExistingPoints(farmData.id);
        
        // Convert existing points to markers
        if (boundaryStore.photos.length > 0) {
          const existingMarkers = boundaryStore.photos.map((point, index) => ({
            id: index.toString(),
            coordinate: {
              latitude: point.location.latitude,
              longitude: point.location.longitude,
            },
            description: point.description || `Point ${index + 1}`
          }));
          
          setMarkers(existingMarkers);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [farmId]);

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    
    // Add new marker
    setMarkers(prevMarkers => [
      ...prevMarkers,
      {
        id: Date.now().toString(),
        coordinate,
        description: `Point ${prevMarkers.length + 1}`
      }
    ]);
  };

  const handleMarkerDrag = (event, markerId) => {
    const { coordinate } = event.nativeEvent;
    
    // Update marker position
    setMarkers(prevMarkers => 
      prevMarkers.map(marker => 
        marker.id === markerId 
          ? { ...marker, coordinate } 
          : marker
      )
    );
  };

  const handleDeleteMarker = (markerId) => {
    // Remove marker
    setMarkers(prevMarkers => 
      prevMarkers.filter(marker => marker.id !== markerId)
    );
  };

  const handleSave = async () => {
    try {
      if (markers.length < 3) {
        Alert.alert('Error', 'At least 3 points are required to form a boundary');
        return;
      }
      
      // Convert markers to boundary points format
      const boundaryPoints = markers.map(marker => ({
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude,
        description: marker.description,
      }));
      
      // Save boundary points
      await saveBoundaryData(farmId, boundaryPoints);
      
      Alert.alert(
        'Success', 
        'Boundary points saved successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/farm-details/${farmId}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error saving boundary points:', error);
      Alert.alert('Error', 'Failed to save boundary points');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Confirm Clear',
      'Are you sure you want to clear all boundary points? This will delete them from the database.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear markers from state
              setMarkers([]);
              
              // Delete boundary points from database
              await deleteAllBoundaryPoints(farmId);
              
              // Clear boundary store
              boundaryStore.setPhotos([]);
              
              Alert.alert('Success', 'All boundary points have been cleared');
            } catch (error) {
              console.error('Error clearing boundary points:', error);
              Alert.alert('Error', 'Failed to clear boundary points from database');
            }
          }
        }
      ]
    );
  };

  if (loading || !initialRegion) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader 
          title="Draw Farm Boundary" 
          showBackButton={true}
          handleBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E9762B" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader 
        title={farm ? `Draw Boundary: ${farm.name}` : "Draw Farm Boundary"}
        showBackButton={true}
        handleBackPress={() => router.back()}
      />
      
      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {markers.map(marker => (
              <Marker
                key={marker.id}
                identifier={marker.id}
                coordinate={marker.coordinate}
                title={marker.description}
                draggable
                onDragEnd={(e) => handleMarkerDrag(e, marker.id)}
              />
            ))}
            
            {markers.length >= 3 && (
              <Polygon
                coordinates={markers.map(marker => marker.coordinate)}
                fillColor="rgba(233, 118, 43, 0.3)"
                strokeColor="#E9762B"
                strokeWidth={2}
              />
            )}
          </MapView>
          
          <View style={styles.mapOverlay}>
            <Text style={styles.instructionText}>
              Tap on the map to add boundary points
            </Text>
            
            <View style={styles.markerCount}>
              <Text style={styles.markerCountText}>
                {markers.length} {markers.length === 1 ? 'point' : 'points'} added
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Feather name="trash-2" size={20} color="#ff4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={markers.length < 3}
          >
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Boundary</Text>
          </TouchableOpacity>
        </View>
        
        {markers.length > 0 && (
          <View style={styles.markerList}>
            <Text style={styles.markerListTitle}>Boundary Points</Text>
            
            {markers.map((marker, index) => (
              <View key={marker.id} style={styles.markerItem}>
                <Text style={styles.markerItemText}>
                  Point {index + 1}: {marker.coordinate.latitude.toFixed(6)}, {marker.coordinate.longitude.toFixed(6)}
                </Text>
                
                <TouchableOpacity
                  style={styles.deleteMarkerButton}
                  onPress={() => handleDeleteMarker(marker.id)}
                >
                  <Feather name="x" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionText: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    color: '#333',
  },
  markerCount: {
    backgroundColor: 'rgba(233, 118, 43, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markerCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9762B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  markerList: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  markerListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  markerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  markerItemText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  deleteMarkerButton: {
    padding: 4,
  },
});

export default DrawMapScreen;
