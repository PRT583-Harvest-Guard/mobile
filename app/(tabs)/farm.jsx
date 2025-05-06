import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CustomButton, FormField, PageHeader } from '@/components';
import { getFarms, createFarm, updateFarm, deleteFarm } from '@/services/BoundaryService';
import { isFeatureEnabled } from '@/services/FeatureFlagService';

const FarmScreen = () => {
  const params = useLocalSearchParams();
  const { editFarmId } = params;
  
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  
  // Form state
  const [farmName, setFarmName] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [plantType, setPlantType] = useState('');
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteEnabled, setDeleteEnabled] = useState(true); // Set to true for testing

  useEffect(() => {
    loadFarms();
    checkDeleteFeatureFlag();
  }, []);
  
  const checkDeleteFeatureFlag = async () => {
    try {
      // For testing purposes, force enable the delete button
      // const enabled = await isFeatureEnabled('delete_farm');
      const enabled = true; // Force enable for testing
      setDeleteEnabled(enabled);
    } catch (error) {
      console.error('Error checking delete farm feature flag:', error);
    }
  };

  useEffect(() => {
    if (editFarmId) {
      handleEditFarm(editFarmId);
    }
  }, [editFarmId]);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const farmsData = await getFarms();
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farms:', error);
      Alert.alert('Error', 'Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFarm = () => {
    // Reset form fields
    setFarmName('');
    setFarmSize('');
    setPlantType('');
    setCurrentFarmId(null);
    setFormMode('create');
    setModalVisible(true);
  };

  const handleEditFarm = async (farmId) => {
    try {
      const farm = farms.find(f => f.id === Number(farmId) || f.id === farmId);
      
      if (!farm) {
        console.error('Farm not found:', farmId);
        return;
      }
      
      // Set form fields
      setFarmName(farm.name || '');
      setFarmSize(farm.size ? farm.size.toString() : '');
      setPlantType(farm.plant_type || '');
      setCurrentFarmId(farm.id);
      setFormMode('edit');
      setModalVisible(true);
    } catch (error) {
      console.error('Error preparing farm edit:', error);
      Alert.alert('Error', 'Failed to prepare farm edit');
    }
  };

  const handleDeleteFarm = async (farmId) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this farm? This will delete all associated data and cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteFarm(farmId);
                Alert.alert(
                  'Success', 
                  'Farm deleted successfully',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        // Reload farms
                        await loadFarms();
                        
                        // Navigate to home page to refresh the state there
                        router.push('/(tabs)/home');
                      }
                    }
                  ]
                );
              } catch (error) {
                console.error('Error deleting farm:', error);
                Alert.alert('Error', 'Failed to delete farm');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing farm deletion:', error);
      Alert.alert('Error', 'Failed to prepare farm deletion');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate inputs
      if (!farmName.trim()) {
        Alert.alert('Error', 'Farm name is required');
        return;
      }
      
      const farmData = {
        name: farmName.trim(),
        size: farmSize ? parseFloat(farmSize) : null,
        plant_type: plantType.trim()
      };
      
      if (formMode === 'edit' && currentFarmId) {
        // Update existing farm
        await updateFarm(currentFarmId, farmData);
        Alert.alert('Success', 'Farm updated successfully');
      } else {
        // Create new farm
        const farmId = await createFarm(farmData);
        Alert.alert(
          'Success', 
          'Farm created successfully',
          [
            {
              text: 'Add Boundary',
              onPress: () => {
                router.push({
                  pathname: "/(auth)/upload-photos",
                  params: { farmId }
                });
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      }
      
      // Reload farms and close modal
      await loadFarms();
      setModalVisible(false);
    } catch (error) {
      console.error('Error submitting farm:', error);
      Alert.alert('Error', 'Failed to save farm');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFarmItem = (farm) => {
    return (
      <TouchableOpacity 
        key={farm.id} 
        style={styles.farmItem}
        onPress={() => router.push(`/farm-details/${farm.id}`)}
      >
        <View style={styles.farmInfo}>
          <Text style={styles.farmName}>{farm.name}</Text>
          <Text style={styles.farmDetails}>
            {farm.size ? `${farm.size} hectares` : 'Size not specified'}
            {farm.plant_type ? ` • ${farm.plant_type}` : ''}
          </Text>
        </View>
        <View style={styles.farmActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditFarm(farm.id);
            }}
          >
            <Feather name="edit" size={20} color="#E9762B" />
          </TouchableOpacity>
          
          {deleteEnabled && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteFarm(farm.id);
              }}
            >
              <Feather name="trash-2" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
          
          <Feather name="chevron-right" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Farms" textColor="white" showBackButton={false} />
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Farms</Text>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E9762B" />
            <Text style={styles.loadingText}>Loading farms...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Your Farms</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddFarm}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Farm</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.farmList}>
              {farms.length > 0 ? (
                farms.map(renderFarmItem)
              ) : (
                <View style={styles.emptyContainer}>
                  <Feather name="alert-circle" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No farms found</Text>
                  <Text style={styles.emptySubtext}>
                    Add a farm to get started with Harvest Guard
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
      
      {/* Farm Form Modal */}
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
                {formMode === 'edit' ? 'Edit Farm' : 'Add New Farm'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <FormField
                title="Farm Name"
                placeholder="Enter farm name"
                value={farmName}
                handleTextChange={setFarmName}
                otherStyles="mb-4"
              />
              
              <FormField
                title="Size (hectares)"
                placeholder="Enter farm size"
                value={farmSize}
                handleTextChange={setFarmSize}
                keyboardType="numeric"
                otherStyles="mb-4"
              />
              
              <FormField
                title="Plant Type"
                placeholder="Enter plant type"
                value={plantType}
                handleTextChange={setPlantType}
                otherStyles="mb-4"
              />
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
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {formMode === 'edit' ? 'Update' : 'Save'}
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
    backgroundColor: '#f5f7fa',
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
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9762B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  farmList: {
    flex: 1,
  },
  farmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  farmDetails: {
    fontSize: 14,
    color: '#666',
  },
  farmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
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

export default FarmScreen;
