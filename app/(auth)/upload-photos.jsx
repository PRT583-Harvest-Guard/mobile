import { CustomButton, Logo, PhotoCapture, PageHeader } from '@/components'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View, StyleSheet, Text, TouchableOpacity, FlatList, Modal } from 'react-native'
import { Feather } from '@expo/vector-icons'
// Temporarily remove map import until we resolve the compatibility issue
// import MapView, { Marker, Polygon } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { saveBoundaryData, getBoundaryData, getFarms, deleteBoundaryPoints } from '@/services/BoundaryService'

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
              console.log('Deleting boundary points for farm ID:', farmId);
              
              try {
                // First verify the farm exists
                const farms = await getFarms();
                const farm = farms.find(f => f.id === Number(farmId));
                
                if (!farm) {
                  throw new Error('Farm not found');
                }
                
                console.log('Found farm:', farm);
                
                // Delete boundary points using the dedicated function
                await deleteBoundaryPoints(farmId);
                
                // Verify deletion
                const remainingPoints = await getBoundaryData(farmId);
                console.log('Remaining points after deletion:', remainingPoints);
                
                if (remainingPoints && remainingPoints.length > 0) {
                  console.warn('Boundary points were not fully deleted!');
                  throw new Error('Failed to delete boundary points');
                }
                
                Alert.alert(
                  "Boundary Points Deleted",
                  "All existing boundary points have been deleted. You can now create new boundary points."
                );
              } catch (error) {
                console.error('Error in deletion process:', error);
                throw error; // Re-throw to be caught by outer catch block
              }
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
      <FlatList
        className='w-full flex-1'
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        data={[1]} // Single item to render the content
        keyExtractor={() => 'main-content'}
        renderItem={() => (
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
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>Existing Points:</Text>
                    <Text style={styles.countBadge}>{existingPoints.length}</Text>
                    <TouchableOpacity 
                      style={styles.deleteAllButton}
                      onPress={() => handleDeleteExistingPoints(0)}
                    >
                      <Feather name="trash-2" size={16} color="#ff4444" />
                      <Text style={styles.deleteAllText}>Delete All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={existingPoints.slice(0, 5)}
                    keyExtractor={(_, index) => `existing-${index}`}
                    renderItem={({ item: point, index }) => (
                      <View style={styles.pointRow}>
                        <View style={styles.pointIndexBadge}>
                          <Text style={styles.pointIndexText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.pointText}>
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </Text>
                      </View>
                    )}
                    ListFooterComponent={() => 
                      existingPoints.length > 5 ? (
                        <TouchableOpacity 
                          style={styles.viewAllButton}
                          onPress={() => {
                            setPointsToShow(existingPoints);
                            setPointsTitle("All Existing Boundary Points");
                            setShowAllPoints(true);
                          }}
                        >
                          <Text style={styles.viewAllText}>
                            View all {existingPoints.length} existing points
                          </Text>
                          <Feather name="chevron-right" size={16} color="#E9762B" />
                        </TouchableOpacity>
                      ) : null
                    }
                  />
                </View>
              )}
              
              {/* Divider if both existing and new points */}
              {existingPoints.length > 0 && boundaryPoints.length > 0 && (
                <View style={styles.divider} />
              )}
              
              {/* New Boundary Points Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>New Points:</Text>
                <Text style={styles.countBadge}>{boundaryPoints.length}</Text>
              </View>
              
              {boundaryPoints.length === 0 ? (
                <Text style={styles.emptyPointsText}>
                  No new boundary points captured yet. Take photos to add points.
                </Text>
              ) : (
                <FlatList
                  data={boundaryPoints.slice(-5)}
                  keyExtractor={(_, index) => `new-${index}`}
                  renderItem={({ item: point, index }) => (
                    <View style={styles.pointRow}>
                      <View style={styles.pointIndexBadge}>
                        <Text style={styles.pointIndexText}>
                          {boundaryPoints.length - 4 + index}
                        </Text>
                      </View>
                      <Text style={styles.pointText}>
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </Text>
                    </View>
                  )}
                  ListFooterComponent={() => 
                    boundaryPoints.length > 5 ? (
                      <TouchableOpacity 
                        style={styles.viewAllButton}
                        onPress={() => {
                          setPointsToShow(boundaryPoints);
                          setPointsTitle("All New Boundary Points");
                          setShowAllPoints(true);
                        }}
                      >
                        <Text style={styles.viewAllText}>
                          View all {boundaryPoints.length} new points
                        </Text>
                        <Feather name="chevron-right" size={16} color="#E9762B" />
                      </TouchableOpacity>
                    ) : null
                  }
                />
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
        )}
      />

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
            
            <FlatList
              data={pointsToShow}
              keyExtractor={(_, index) => `modal-point-${index}`}
              renderItem={({ item: point, index }) => (
                <View style={styles.modalPointRow}>
                  <Text style={styles.modalPointIndex}>{index + 1}</Text>
                  <Text style={styles.modalPointText}>
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            />
            
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
    marginBottom: 12,
  },
  boundaryInfoText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  existingPointsSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#E9762B',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  deleteAllText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pointIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E9762B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pointIndexText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointText: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  emptyPointsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 118, 43, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E9762B',
    fontWeight: 'bold',
    marginRight: 4,
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
