import { CustomButton, Logo, PhotoCapture, PageHeader } from '@/components'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { Feather } from '@expo/vector-icons'
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
  const [showAllPoints, setShowAllPoints] = useState(false);
  const [pointsToShow, setPointsToShow] = useState([]);
  const [pointsTitle, setPointsTitle] = useState("");

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
  
  // Handle deletion of existing boundary points
  const handleDeleteExistingPoints = (index) => {
    Alert.alert(
      "Delete Boundary Points",
      "This will delete ALL existing boundary points for this farm. Are you sure you want to continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear existing points in state
              setExistingPoints([]);
              
              // Clear existing points in database
              if (farmId) {
                await saveBoundaryData(farmId, []);
                Alert.alert(
                  "Boundary Points Deleted",
                  "All existing boundary points have been deleted. You can now create new boundary points."
                );
              }
            } catch (error) {
              console.error('Error deleting boundary points:', error);
              Alert.alert(
                "Error",
                "Failed to delete boundary points. Please try again."
              );
              // Reload existing points
              if (farmId) {
                const points = await getBoundaryData(farmId);
                if (points && points.length > 0) {
                  const formattedPoints = points.map(point => ({
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }));
                  setExistingPoints(formattedPoints);
                }
              }
            }
          }
        }
      ]
    );
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
      <ScrollView 
        className='w-full flex-1'
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View className='w-full flex-col items-center px-4 pt-4'>
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
          
          {/* Existing Boundary Points Section */}
          {existingPoints.length > 0 && (
            <View style={styles.existingPointsSection}>
              <Text style={styles.sectionLabel}>Existing Points:</Text>
              <Text style={styles.boundaryInfoText}>
                {existingPoints.length} existing boundary points
              </Text>
              <View style={styles.pointsList}>
                {existingPoints.slice(0, 3).map((point, index) => (
                  <View key={`existing-${index}`} style={styles.pointRow}>
                    <Text style={styles.pointText}>
                      Point {index + 1}: 
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExistingPoints(index)}
                    >
                      <Feather name="trash-2" size={16} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {existingPoints.length > 3 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setPointsToShow(existingPoints);
                      setPointsTitle("All Existing Boundary Points");
                      setShowAllPoints(true);
                    }}
                  >
                    <Text style={styles.viewAllText}>
                      View all {existingPoints.length} existing points
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {/* Divider if both existing and new points */}
          {existingPoints.length > 0 && boundaryPoints.length > 0 && (
            <View style={styles.divider} />
          )}
          
          {/* New Boundary Points Section */}
          <Text style={styles.boundaryInfoText}>
            {boundaryPoints.length === 0 
              ? "No new boundary points captured yet. Take photos to add points." 
              : `${boundaryPoints.length} new boundary points captured`}
          </Text>
          {boundaryPoints.length > 0 && (
            <View style={styles.pointsList}>
              {boundaryPoints.slice(-3).map((point, index) => (
                <Text key={`new-${index}`} style={styles.pointText}>
                  Point {boundaryPoints.length - 2 + index}: 
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </Text>
              ))}
              {boundaryPoints.length > 3 && (
                <TouchableOpacity 
                  onPress={() => {
                    setPointsToShow(boundaryPoints);
                    setPointsTitle("All New Boundary Points");
                    setShowAllPoints(true);
                  }}
                >
                  <Text style={styles.viewAllText}>
                    View all {boundaryPoints.length} new points
                  </Text>
                </TouchableOpacity>
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
          <View className='w-full pb-4'>
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
      </ScrollView>

      {/* Modal to show all boundary points */}
      <Modal
        visible={showAllPoints}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllPoints(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pointsTitle}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAllPoints(false)}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {pointsToShow.map((point, index) => (
                <View key={`modal-point-${index}`} style={styles.modalPointRow}>
                  <Text style={styles.modalPointIndex}>{index + 1}</Text>
                  <Text style={styles.modalPointText}>
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </Text>
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setShowAllPoints(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// No need for export at the bottom since we're using export default at the function declaration

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
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
  existingPointsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  pointsList: {
    marginTop: 8,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
    flex: 1,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 4,
    marginLeft: 8,
  },
  morePointsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E9762B',
    fontWeight: 'bold',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalPointIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9762B',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    marginRight: 12,
    overflow: 'hidden',
    lineHeight: 30,
  },
  modalPointText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#E9762B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
