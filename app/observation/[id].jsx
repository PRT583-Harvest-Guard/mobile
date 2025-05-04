import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Image
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PageHeader, CustomButton, ObservationPhotoCapture } from '@/components';
import { updateObservationPoint, getObservationPoints } from '@/services/ObservationService';
import { getFarms } from '@/services/BoundaryService';
import { saveObservation, getLatestObservation, updateObservation } from '@/services/ObservationRecordService';

const ObservationDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [observation, setObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusOptions] = useState(['Nil', 'Pending', 'Completed', 'Requires Attention']);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [detection, setDetection] = useState(false);
  const [severity, setSeverity] = useState(0);
  const [notes, setNotes] = useState('');
  const [existingObservation, setExistingObservation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pictureUri, setPictureUri] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadObservationDetails();
    loadExistingObservation();
  }, [id]);

  const loadExistingObservation = async () => {
    try {
      if (!id) return;
      
      const latestObservation = await getLatestObservation(id);
      if (latestObservation) {
        setExistingObservation(latestObservation);
        setIdentifier(latestObservation.identifier || '');
        setDetection(latestObservation.detection === 1);
        setSeverity(latestObservation.severity || 0);
        setNotes(latestObservation.notes || '');
        setPictureUri(latestObservation.picture_uri || null);
      }
    } catch (error) {
      console.error('Error loading existing observation:', error);
    }
  };

  const loadObservationDetails = async () => {
    try {
      setLoading(true);
      
      // Get the observation point by ID
      // Since we don't have a direct getById function, we'll get all points for the farm
      // and find the one with the matching ID
      const farmId = await getFarmIdFromObservationId(id);
      if (!farmId) {
        console.error('Could not find farm ID for observation:', id);
        return;
      }
      
      const points = await getObservationPoints(farmId);
      const observationData = points.find(p => p.id === Number(id) || p.id === id);
      
      if (!observationData) {
        console.error('Observation not found:', id);
        return;
      }
      
      setObservation(observationData);
      setSelectedStatus(observationData.observation_status || 'Nil');
    } catch (error) {
      console.error('Error loading observation details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get farm ID from observation ID
  const getFarmIdFromObservationId = async (observationId) => {
    try {
      // This is a simplified approach - in a real app, you might have a more direct way
      // to get the farm ID for an observation
      const allFarms = await getFarms();
      
      for (const farm of allFarms) {
        const points = await getObservationPoints(farm.id);
        const found = points.find(p => p.id === Number(observationId) || p.id === observationId);
        if (found) {
          return farm.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting farm ID for observation:', error);
      return null;
    }
  };

  const handleStatusChange = async (status) => {
    try {
      setSelectedStatus(status);
      
      // Update the observation status in the database
      if (observation) {
        await updateObservationPoint(observation.id, { observation_status: status });
        
        // Reload the observation to get the updated data
        loadObservationDetails();
      }
    } catch (error) {
      console.error('Error updating observation status:', error);
    }
  };

  const handleSubmitObservation = async () => {
    try {
      setSubmitting(true);
      
      if (!observation || !observation.farm_id) {
        console.error('Missing farm ID');
        return;
      }
      
      const observationData = {
        farm_id: observation.farm_id,
        observation_point_id: observation.id,
        identifier,
        detection: detection ? 1 : 0,
        severity: detection ? severity : 0,
        notes,
        picture_uri: pictureUri
      };
      
      if (isEditMode && existingObservation) {
        // Update existing observation
        await updateObservation(existingObservation.id, {
          identifier,
          detection: detection ? 1 : 0,
          severity: detection ? severity : 0,
          notes,
          picture_uri: pictureUri
        });
        console.log('Observation updated successfully');
      } else {
        // Create new observation
        await saveObservation(observationData);
        console.log('New observation saved successfully');
      }
      
      // Close the modal
      setModalVisible(false);
      
      // Reload the observation details to update the status
      loadObservationDetails();
      loadExistingObservation();
    } catch (error) {
      console.error('Error submitting observation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityLabel = (value) => {
    if (value === 0) return 'None';
    if (value <= 3) return 'Mild';
    if (value <= 5) return 'Moderate';
    if (value <= 8) return 'Severe';
    return 'Critical';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <PageHeader title="Observation Details" textColor="white" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E9762B" />
          <Text style={styles.loadingText}>Loading observation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!observation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <PageHeader title="Observation Details" textColor="white" />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Observation not found</Text>
          <CustomButton
            title="Go Back"
            handlePress={() => router.back()}
            containerStyles={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Observation Details" textColor="white" />
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Link href="/(tabs)/farm" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Farm</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Link href={`/farm-details/${observation.farm_id}`} style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Farm Details</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Observation Details</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{observation.name || `Section ${observation.segment}`}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Segment:</Text>
            <Text style={styles.detailValue}>{observation.segment}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Coordinates:</Text>
            <Text style={styles.detailValue}>
              {observation.latitude.toFixed(5)}, {observation.longitude.toFixed(5)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {observation.created_at ? new Date(observation.created_at).toLocaleString() : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Observation Status:</Text>
            <View style={styles.statusOptions}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    selectedStatus === status && styles.selectedStatusButton
                  ]}
                  onPress={() => handleStatusChange(status)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedStatus === status && styles.selectedStatusButtonText
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {selectedStatus === 'Nil' ? (
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={() => {
                setIsEditMode(false);
                setModalVisible(true);
              }}
            >
              <Feather name="edit-3" size={18} color="#fff" style={styles.recordButtonIcon} />
              <Text style={styles.recordButtonText}>Record Observation</Text>
            </TouchableOpacity>
          ) : selectedStatus === 'Completed' && existingObservation && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                // Pre-fill form with existing data
                setIdentifier(existingObservation.identifier || '');
                setDetection(existingObservation.detection === 1);
                setSeverity(existingObservation.severity || 0);
                setNotes(existingObservation.notes || '');
                setPictureUri(existingObservation.picture_uri || null);
                setIsEditMode(true);
                setModalVisible(true);
              }}
            >
              <Feather name="edit-2" size={18} color="#fff" style={styles.recordButtonIcon} />
              <Text style={styles.recordButtonText}>Edit Observation</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {selectedStatus === 'Nil' && (
          <View style={styles.complianceCard}>
            <Text style={styles.complianceText}>
              Observation is required to meet compliance
            </Text>
          </View>
        )}
        
        {selectedStatus === 'Completed' && existingObservation && (
          <View style={styles.observationSummaryCard}>
            <Text style={styles.observationSummaryTitle}>Observation Summary</Text>
            
            <View style={styles.observationDetail}>
              <Text style={styles.observationLabel}>Identifier:</Text>
              <Text style={styles.observationValue}>{existingObservation.identifier || 'None'}</Text>
            </View>
            
            <View style={styles.observationDetail}>
              <Text style={styles.observationLabel}>Pest/Disease:</Text>
              <Text style={styles.observationValue}>
                {existingObservation.detection === 1 ? 'Detected' : 'None detected'}
              </Text>
            </View>
            
            {existingObservation.detection === 1 && (
              <View style={styles.observationDetail}>
                <Text style={styles.observationLabel}>Severity:</Text>
                <Text style={styles.observationValue}>
                  {getSeverityLabel(existingObservation.severity)} ({existingObservation.severity})
                </Text>
              </View>
            )}
            
            {existingObservation.picture_uri && (
              <View style={styles.observationImageContainer}>
                <Image 
                  source={{ uri: existingObservation.picture_uri }} 
                  style={styles.observationImage}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {existingObservation.notes && (
              <View style={styles.observationDetail}>
                <Text style={styles.observationLabel}>Notes:</Text>
                <Text style={styles.observationValue}>{existingObservation.notes}</Text>
              </View>
            )}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.farmDetailsButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.farmDetailsButtonText}>Back to Farm Details</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Observation Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Observation' : 'Record Observation'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Identifier:</Text>
                <TextInput
                  style={styles.formInput}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Enter identifier"
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.formLabel}>Pest/Disease Detected:</Text>
                  <Switch
                    value={detection}
                    onValueChange={setDetection}
                    trackColor={{ false: '#d1d1d1', true: '#E9762B' }}
                    thumbColor={detection ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
              
              {detection && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Severity: {getSeverityLabel(severity)} ({severity})</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      value={severity}
                      onValueChange={setSeverity}
                      minimumTrackTintColor="#E9762B"
                      maximumTrackTintColor="#d1d1d1"
                      thumbTintColor="#E9762B"
                    />
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>None</Text>
                      <Text style={styles.sliderLabel}>Mild</Text>
                      <Text style={styles.sliderLabel}>Moderate</Text>
                      <Text style={styles.sliderLabel}>Severe</Text>
                      <Text style={styles.sliderLabel}>Critical</Text>
                    </View>
                    <View style={styles.sliderValues}>
                      <Text style={styles.sliderValue}>0</Text>
                      <Text style={styles.sliderValue}>3</Text>
                      <Text style={styles.sliderValue}>5</Text>
                      <Text style={styles.sliderValue}>8</Text>
                      <Text style={styles.sliderValue}>10</Text>
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Photo Evidence:</Text>
                    <ObservationPhotoCapture onPhotoCapture={setPictureUri} />
                  </View>
                </>
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes:</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Enter any additional information"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitObservation}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update' : 'Submit'}
                  </Text>
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
  headerContainer: {
    backgroundColor: '#1B4D3E',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#1B4D3E',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  breadcrumbActiveText: {
    fontSize: 14,
    color: '#E9762B',
    fontWeight: 'bold',
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    marginTop: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedStatusButton: {
    backgroundColor: '#E9762B',
    borderColor: '#E9762B',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#555',
  },
  selectedStatusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  farmDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B4D3E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  farmDetailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9762B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordButtonIcon: {
    marginRight: 8,
  },
  complianceCard: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffd54f',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceText: {
    fontSize: 16,
    color: '#ff8f00',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  observationSummaryCard: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#81c784',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  observationSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  observationDetail: {
    marginBottom: 12,
  },
  observationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  observationValue: {
    fontSize: 16,
    color: '#333',
  },
  observationImageContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  observationImage: {
    width: '100%',
    height: '100%',
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderValue: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
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
  submitButton: {
    backgroundColor: '#E9762B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ObservationDetailsScreen;
