import { CustomButton, Logo, PhotoCapture, PageHeader } from '@/components'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View, StyleSheet, Text } from 'react-native'
// Temporarily remove map import until we resolve the compatibility issue
// import MapView, { Marker, Polygon } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { saveBoundaryData, getBoundaryData, getFarms } from '@/services/BoundaryService'

export default function UploadPhotos() {
  const params = useLocalSearchParams();
  const { farmId } = params;
  
  // Calculate required photos based on farm size or use default
  const [requiredPhotoNum, setRequiredPhotoNum] = useState(20);
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [existingPoints, setExistingPoints] = useState([]);
  const [farmData, setFarmData] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [mapReady, setMapReady] = useState(false);

  // Calculate required photos based on farm size
  const getRequiredPhotoCount = (farmSize) => {
    // Base requirement on property size (acres)
    // Minimum 8 photos, maximum 30 photos
    // For each acre, require approximately 2 photos
    return farmSize ? Math.max(8, Math.min(30, Math.ceil(farmSize * 2))) : 20;
  };

  // Request location permissions and load existing boundary points
  React.useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to map your property boundary.');
        return;
      }

      // Get current location for map center
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.log('Error getting current location:', error);
      }

      // Load existing boundary points and farm data if editing a farm
      if (farmId) {
        try {
          // Get boundary points
          const points = await getBoundaryData(farmId);
          if (points && points.length > 0) {
            const formattedPoints = points.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }));
            setExistingPoints(formattedPoints);
          }
          
          // Get farm data to calculate required photos and display farm info
          const farms = await getFarms();
          const farm = farms.find(f => f.id === Number(farmId));
          if (farm) {
            setFarmData(farm);
            if (farm.size) {
              const photoCount = getRequiredPhotoCount(farm.size);
              setRequiredPhotoNum(photoCount);
            }
          }
        } catch (error) {
          console.log('Error loading farm data:', error);
        }
      }
    })();
  }, [farmId]);

  const handleMapReady = () => {
    setMapReady(true);
  };

  const handlePhotoCapture = async (newPhoto) => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Check location accuracy
      if (location.coords.accuracy > 50) { // More than 50 meters accuracy is poor
        Alert.alert(
          'Poor GPS Accuracy', 
          `Current GPS accuracy is ${Math.round(location.coords.accuracy)}m, which may affect boundary precision. Would you like to:`,
          [
            {
              text: 'Try Again',
              style: 'cancel'
            },
            {
              text: 'Use Anyway',
              onPress: () => {
                // Add photo with location data despite poor accuracy
                addPhotoWithLocation(newPhoto, location);
              }
            }
          ]
        );
        return;
      }

      // Add photo with good location accuracy
      addPhotoWithLocation(newPhoto, location);
    } catch (error) {
      console.error('Location error:', error);
      
      // Determine specific error message based on error type
      let errorMessage = 'Failed to get location.';
      let actionMessage = 'Please ensure location services are enabled.';
      
      if (error.code === 'LOCATION_UNAVAILABLE') {
        errorMessage = 'Location service unavailable.';
        actionMessage = 'Please check your device settings and try again.';
      } else if (error.code === 'LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out.';
        actionMessage = 'Please try again in an area with better GPS signal.';
      } else if (error.code === 'LOCATION_PERMISSION_DENIED') {
        errorMessage = 'Location permission denied.';
        actionMessage = 'Please enable location permissions in your device settings.';
      }
      
      Alert.alert(
        'Location Error', 
        `${errorMessage} ${actionMessage}`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Try Again',
            onPress: () => {
              // Retry location permission
              Location.requestForegroundPermissionsAsync();
            }
          }
        ]
      );
    }
  };

  // Helper function to add a photo with location data
  const addPhotoWithLocation = (photo, location) => {
    // Add photo with location data
    const photoWithLocation = {
      uri: photo.uri,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
      timestamp: new Date().toISOString(),
    };

    setPhotos(prev => [...prev, photoWithLocation]);
    setBoundaryPoints(prev => [...prev, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }]);
  };

  const save = async () => {
    // Validate there are at least some boundary points
    if (boundaryPoints.length === 0) {
      Alert.alert(
        "No Boundary Points", 
        "You haven't captured any boundary points yet. Take at least one photo to save progress.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (farmId) {
        await saveBoundaryData(farmId, boundaryPoints);
        Alert.alert(
          "Progress Saved", 
          `${boundaryPoints.length} boundary points saved successfully.`,
          [{ 
            text: "OK", 
            onPress: () => router.replace(`/farm-details/${farmId}`)
          }]
        );
      } else {
        await saveBoundaryData(null, boundaryPoints);
        Alert.alert(
          "Progress Saved", 
          `${boundaryPoints.length} boundary points saved successfully.`,
          [{ 
            text: "OK", 
            onPress: () => router.replace("/(tabs)/home")
          }]
        );
      }
    } catch (error) {
      console.error('Save error:', error);
      
      // Provide more specific error message based on error type
      let errorMessage = error.message || "Failed to save boundary data.";
      let recoveryMessage = "Please try again.";
      
      if (errorMessage.includes("database")) {
        errorMessage = "Database error occurred.";
        recoveryMessage = "Please try again or restart the app.";
      } else if (errorMessage.includes("network")) {
        errorMessage = "Network error occurred.";
        recoveryMessage = "Please check your connection and try again.";
      }
      
      Alert.alert(
        "Save Error", 
        `${errorMessage} ${recoveryMessage}`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Try Again", 
            onPress: () => save()
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const submit = async () => {
    // Validate photo count
    if (photos.length < requiredPhotoNum) {
      const remaining = requiredPhotoNum - photos.length;
      Alert.alert(
        "More Photos Needed", 
        `Please upload ${remaining} more photo${remaining > 1 ? 's' : ''} to complete the boundary mapping.`,
        [{ text: "OK" }]
      );
      return;
    }

    // Validate boundary shape (at least 3 points for a valid polygon)
    if (boundaryPoints.length < 3) {
      Alert.alert(
        "Invalid Boundary", 
        "At least 3 boundary points are needed to form a valid property boundary.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (farmId) {
        await saveBoundaryData(farmId, boundaryPoints);
        Alert.alert(
          "Boundary Completed", 
          `${boundaryPoints.length} boundary points saved successfully. Your farm boundary is now complete.`,
          [{ 
            text: "View Farm", 
            onPress: () => router.replace(`/farm-details/${farmId}`)
          }]
        );
      } else {
        await saveBoundaryData(null, boundaryPoints);
        Alert.alert(
          "Boundary Completed", 
          "Boundary points saved successfully. Your property boundary is now complete.",
          [{ 
            text: "Continue", 
            onPress: () => router.replace("/(tabs)/farm-layout")
          }]
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      // Provide more specific error message based on error type
      let errorMessage = error.message || "Failed to save boundary data.";
      let recoveryMessage = "Please try again.";
      
      if (errorMessage.includes("database")) {
        errorMessage = "Database error occurred.";
        recoveryMessage = "Please try again or restart the app.";
      } else if (errorMessage.includes("network")) {
        errorMessage = "Network error occurred.";
        recoveryMessage = "Please check your connection and try again.";
      }
      
      Alert.alert(
        "Submission Error", 
        `${errorMessage} ${recoveryMessage}`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Try Again", 
            onPress: () => submit()
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBack = () => {
    if (farmId) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <SafeAreaView className='bg-primary h-full'>
      <PageHeader 
        title={farmData ? `Boundary: ${farmData.name}` : "Upload Boundary Photos"} 
        textColor="white"
        showBackButton={true}
        handleBackPress={handleBack}
      />
      <View className='w-full flex-1 flex-col items-center px-4 pt-4'>
        {/* Logo */}
        <View className="w-full items-center justify-center mb-4">
          <Logo containerStyles="w-24 h-24" />
        </View>
        
        {/* Farm Info */}
        {farmData && (
          <View style={styles.farmInfoContainer}>
            <Text style={styles.farmInfoTitle}>{farmData.name}</Text>
            <Text style={styles.farmInfoText}>
              Size: {farmData.size ? `${farmData.size} acres` : 'Not specified'}
            </Text>
            {farmData.plant_type && (
              <Text style={styles.farmInfoText}>
                Plants: {farmData.plant_type}
              </Text>
            )}
          </View>
        )}
        
        {/* Boundary Points Info */}
        <View style={styles.boundaryInfoContainer}>
          <Text style={styles.boundaryInfoTitle}>Boundary Points</Text>
          <Text style={styles.boundaryInfoText}>
            {boundaryPoints.length === 0 
              ? "No boundary points captured yet. Take photos to add points." 
              : `${boundaryPoints.length} boundary points captured`}
          </Text>
          {boundaryPoints.length > 0 && (
            <View style={styles.pointsList}>
              {boundaryPoints.slice(-3).map((point, index) => (
                <Text key={index} style={styles.pointText}>
                  Point {boundaryPoints.length - 2 + index}: 
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </Text>
              ))}
              {boundaryPoints.length > 3 && (
                <Text style={styles.morePointsText}>
                  ...and {boundaryPoints.length - 3} more points
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Photo Uploading Component */}
        <View className='w-full flex-1 mt-4'>
          <PhotoCapture
            title={`Please Upload at least ${requiredPhotoNum} photos at the border of your property `}
            titleStyles='text-white'
            photos={photos}
            setPhotos={handlePhotoCapture}
          />
        </View>

        {/* Buttons */}
        <View className='w-full pb-4 px-4'>
          <CustomButton
            title="Save"
            handlePress={save}
            containerStyles="w-full mb-7"
            isLoading={isSubmitting}
          />
          <CustomButton
            title={photos.length === requiredPhotoNum ? "Complete" : `(${photos.length}) / ${requiredPhotoNum}`}
            handlePress={submit}
            containerStyles="w-full"
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

// No need for export at the bottom since we're using export default at the function declaration

const styles = StyleSheet.create({
  farmInfoContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  farmInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  farmInfoText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  boundaryInfoContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  boundaryInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  boundaryInfoText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  pointsList: {
    marginTop: 8,
  },
  pointText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  morePointsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
