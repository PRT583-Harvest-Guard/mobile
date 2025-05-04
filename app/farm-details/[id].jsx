import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getFarms, getBoundaryData, deleteFarm } from '@/services/BoundaryService';
import { isFeatureEnabled } from '@/services/FeatureFlagService';
import { getOrGenerateObservationPoints, saveObservationPoints } from '@/services/ObservationService';
import { CustomButton, PageHeader, BoundaryMap, MapSections } from '@/components';

const FarmDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [farm, setFarm] = useState(null);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [observationPoints, setObservationPoints] = useState([]);
  const [deleteEnabled, setDeleteEnabled] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);


  // State for farm details and boundary points
  useEffect(() => {
    loadFarmDetails();
    loadObservationPoints();
    checkDeleteFeatureFlag();
  }, [id]);
  
  const checkDeleteFeatureFlag = async () => {
    try {
      const enabled = await isFeatureEnabled('delete_farm');
      setDeleteEnabled(enabled);
    } catch (error) {
      console.error('Error checking delete farm feature flag:', error);
    }
  };

  const loadObservationPoints = async () => {
    try {
      if (!id) return;
      
      // Get observation points from database or generate if none exist
      const points = await getOrGenerateObservationPoints(id);
      setObservationPoints(points);
    } catch (error) {
      console.error('Error loading observation points:', error);
    }
  };

  const loadFarmDetails = async () => {
    try {
      setLoading(true);
      
      // Get all farms and find the one with matching ID
      const farms = await getFarms();
      const farmData = farms.find(f => f.id === Number(id) || f.id === id);
      
      if (!farmData) {
        Alert.alert('Error', 'Farm not found');
        router.back();
        return;
      }
      
      setFarm(farmData);
      
      // Load boundary points
      const points = await getBoundaryData(farmData.id);
      
      // Validate boundary points
      const validPoints = points.filter(point => 
        point && 
        typeof point.latitude === 'number' && !isNaN(point.latitude) && 
        typeof point.longitude === 'number' && !isNaN(point.longitude)
      );
      
      console.log('All boundary points:', points);
      console.log('Valid boundary points:', validPoints);
      
      if (validPoints.length !== points.length) {
        console.warn(`Found ${points.length - validPoints.length} invalid boundary points`);
      }
      
      setBoundaryPoints(validPoints);
    } catch (error) {
      console.error('Error loading farm details:', error);
      Alert.alert('Error', 'Failed to load farm details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkersUpdated = async (newMarkers) => {
    console.log('handleMarkersUpdated called with', newMarkers.length, 'markers');
    
    // Set markers in state
    setMarkers(newMarkers);
    
    // If we already have observation points, don't save new ones
    if (observationPoints.length > 0) {
      console.log('Using existing observation points from database');
      return;
    }
    
    try {
      if (!farm || !farm.id) {
        console.log('No farm data available, cannot save observation points');
        return;
      }
      
      // Prepare points for saving to database
      const pointsToSave = newMarkers.map(marker => ({
        farm_id: farm.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        segment: marker.segment,
        observation_status: 'Nil',
        name: `Section ${marker.segment}`
      }));
      
      // Save points to database
      console.log('Saving observation points to database:', pointsToSave);
      const savedPoints = await saveObservationPoints(farm.id, pointsToSave);
      
      // Update state with saved points
      console.log('Saved points:', savedPoints.length);
      setObservationPoints(savedPoints);
    } catch (error) {
      console.error('Error saving observation points:', error);
      Alert.alert('Error', 'Failed to save observation points');
    }
  };

  const handleEditFarm = () => {
    router.push({
      pathname: '/(tabs)/farm',
      params: { editFarmId: farm.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Farm Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E9762B" />
          <Text style={styles.loadingText}>Loading farm details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!farm) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Farm Details" />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Farm not found</Text>
          <CustomButton
            title="Go Back"
            handlePress={() => router.back()}
            containerStyles={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteFarm = async () => {
    try {
      setDeleting(true);
      
      if (!farm || !farm.id) {
        Alert.alert('Error', 'Farm not found');
        return;
      }
      
      // Delete the farm and all associated data
      await deleteFarm(farm.id);
      
      // Close the modal
      setDeleteConfirmVisible(false);
      
      // Show success message
      Alert.alert(
        'Success',
        'Farm deleted successfully',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting farm:', error);
      Alert.alert('Error', 'Failed to delete farm');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Farm Details" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.farmName}>{farm.name}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleEditFarm} style={styles.editButton}>
              <Feather name="edit" size={24} color="#E9762B" />
            </TouchableOpacity>
            
            {deleteEnabled && (
              <TouchableOpacity 
                onPress={() => setDeleteConfirmVisible(true)} 
                style={styles.deleteButton}
              >
                <Feather name="trash-2" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Farm Boundary</Text>
            <TouchableOpacity
              style={styles.boundaryButton}
              onPress={() => router.push({
                pathname: "/(auth)/upload-photos",
                params: { farmId: farm.id }
              })}
            >
              <Feather name="edit-2" size={14} color="#E9762B" />
              <Text style={styles.boundaryButtonText}>Boundary</Text>
            </TouchableOpacity>
          </View>
          {boundaryPoints.length > 0 ? (
            <>
              <BoundaryMap
                points={boundaryPoints}
                observationPoints={observationPoints}
                style={styles.boundaryMap}
                showPoints={true}
                numSegments={6}
                boundaryWidth={2}
                segmentFill='rgba(100,150,240,0.2)'
                lineColor='#E9762B'
                lineWidth={1}
                pointColor={'black'}
                onMarkerUpdated={handleMarkersUpdated}
              />
              <Text style={styles.boundaryInfoText}>
                {boundaryPoints.length} boundary points define this farm's perimeter
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No boundary points defined</Text>
          )}
        </View>
        <View style={styles.card}>
        <MapSections markers={observationPoints.length > 0 ? observationPoints : (markers.length > 0 ? markers : [])} />
        </View>
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Farm</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Feather name="alert-triangle" size={48} color="#ff4444" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                Are you sure you want to delete this farm?
              </Text>
              <Text style={styles.warningSubtext}>
                This will permanently delete all farm data, including boundaries, observation points, and observations. This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={handleDeleteFarm}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  farmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  boundaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 118, 43, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(233, 118, 43, 0.3)',
  },
  boundaryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E9762B',
    marginLeft: 4,
  },
  boundaryMap: {
    width: '100%',
    height: 200,
  },
  boundaryInfoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginVertical: 16,
  },
  button: {
    marginTop: 16,
    width: 200,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    alignItems: 'center',
  },
  warningIcon: {
    marginBottom: 16,
  },
  warningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteConfirmButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FarmDetailsScreen;
