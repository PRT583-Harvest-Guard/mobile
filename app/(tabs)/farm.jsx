import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomButton, FormField, PageHeader } from '@/components';
import { getFarms, createFarm, updateFarm, deleteFarm } from '@/services/BoundaryService';
import { isFeatureEnabled } from '@/services/FeatureFlagService';
import { showSuccessToast, showErrorToast } from '@/utils/toastUtils';
import { useGlobalContext } from '@/context/GlobalProvider';

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
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        showErrorToast('User not found, please sign in again');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        showErrorToast('User ID not found, please sign in again');
        return;
      }
      
      // Get farms for the current user
      const farmsData = await getFarms(userId);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farms:', error);
      showErrorToast('Failed to load farms');
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
      showErrorToast('Failed to prepare farm edit');
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
                        // router.push('/(tabs)/home');
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
        showErrorToast('Farm name is required');
        return;
      }
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        showErrorToast('User not found, please sign in again');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        showErrorToast('User ID not found, please sign in again');
        return;
      }
      
      const farmData = {
        name: farmName.trim(),
        size: farmSize ? parseFloat(farmSize) : null,
        plant_type: plantType.trim(),
        user_id: userId
      };
      
      if (formMode === 'edit' && currentFarmId) {
        // Update existing farm
        await updateFarm(currentFarmId, farmData);
        showSuccessToast('Farm updated successfully');
      } else {
        // Create new farm
        const farmId = await createFarm(farmData);
        
        // Show success toast
        showSuccessToast('Farm created successfully');
        
        // Still use Alert for the boundary option since Toast doesn't support multiple buttons
        Alert.alert(
          'Add Boundary', 
          'Would you like to add a boundary to your farm?',
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
              text: 'Later',
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
      showErrorToast('Failed to save farm');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFarmItem = (farm) => {
    return (
      <TouchableOpacity 
        key={farm.id} 
        className="flex-row justify-between items-center bg-[#f9f9f9] rounded-lg p-4 mb-3 shadow-sm"
        onPress={() => router.push(`/farm-details/${farm.id}`)}
      >
        <View className="flex-1">
          <Text className="text-lg font-pbold text-[#333] mb-1">{farm.name}</Text>
          <Text className="text-sm text-[#666]">
            {farm.size ? `${farm.size} hectares` : 'Size not specified'}
            {farm.plant_type ? ` • ${farm.plant_type}` : ''}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="p-2 mr-2"
            onPress={(e) => {
              e.stopPropagation();
              handleEditFarm(farm.id);
            }}
          >
            <Feather name="edit" size={20} color="#E9762B" />
          </TouchableOpacity>
          
          {deleteEnabled && (
            <TouchableOpacity 
              className="p-2 mr-2"
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
    <SafeAreaView className="flex-1 bg-[#f5f7fa]">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader title="Farms" textColor="white" showBackButton={false} />
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Farms</Text>
      </View>
      
      <View className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#E9762B" />
            <Text className="mt-4 text-base text-[#666]">Loading farms...</Text>
          </View>
        ) : (
          <>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-pbold text-[#333]">Your Farms</Text>
              <TouchableOpacity 
                className="flex-row items-center bg-secondary py-2 px-3 rounded-lg"
                onPress={handleAddFarm}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text className="text-white font-pbold ml-1">Add Farm</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1">
              {farms.length > 0 ? (
                farms.map(renderFarmItem)
              ) : (
                <View className="flex-1 justify-center items-center py-[60px]">
                  <Feather name="alert-circle" size={48} color="#ccc" />
                  <Text className="text-lg font-pbold text-[#666] mt-4">No farms found</Text>
                  <Text className="text-sm text-[#999] text-center mt-2 px-8">
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50 justify-center items-center p-5"
        >
          <View className="bg-white rounded-xl w-full max-h-[80%] shadow-md">
            <View className="flex-row justify-between items-center p-4 border-b border-[#eee]">
              <Text className="text-lg font-pbold text-[#333]">
                {formMode === 'edit' ? 'Edit Farm' : 'Add New Farm'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4 max-h-[400px]">
              <FormField
                title="Farm Name"
                value={farmName}
                handleTextChange={setFarmName}
                otherStyles="mb-4"
              />
              
              <FormField
                title="Size (hectares)"
                value={farmSize}
                handleTextChange={setFarmSize}
                keyboardType="numeric"
                otherStyles="mb-4"
              />
              
              <FormField
                title="Plant Type"
                value={plantType}
                handleTextChange={setPlantType}
                otherStyles="mb-4"
              />
            </ScrollView>
            
            <View className="flex-row justify-end p-4 border-t border-[#eee]">
              <TouchableOpacity 
                className="bg-[#f0f0f0] py-[10px] px-4 rounded-lg mr-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-[#666] text-base font-pbold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-secondary py-[10px] px-4 rounded-lg"
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-base font-pbold">
                    {formMode === 'edit' ? 'Update' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};


export default FarmScreen;
