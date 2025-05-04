import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PageHeader, CustomButton } from '@/components';
import { updateObservationPoint, getObservationPoints } from '@/services/ObservationService';
import { getFarms } from '@/services/BoundaryService';

const ObservationDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [observation, setObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusOptions] = useState(['Nil', 'Pending', 'Completed', 'Requires Attention']);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadObservationDetails();
  }, [id]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Observation Details" />
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
        <PageHeader title="Observation Details" />
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
      <PageHeader title="Observation Details" />
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
          
          {selectedStatus === 'Nil' && (
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={() => console.log('Record observation pressed')}
            >
              <Feather name="edit-3" size={18} color="#fff" style={styles.recordButtonIcon} />
              <Text style={styles.recordButtonText}>Record Observation</Text>
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
        
        <CustomButton
          title="Back to Farm"
          handlePress={() => router.back()}
          containerStyles={styles.backButton}
        />
      </ScrollView>
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
  backButton: {
    marginTop: 16,
    marginBottom: 32,
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
});

export default ObservationDetailsScreen;
