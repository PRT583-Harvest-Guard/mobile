import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, router, Link, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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


  // Load data when the component mounts
  useEffect(() => {
    const loadAllData = async () => {
      await loadFarmDetails();
      // Add a small delay to ensure farm data is loaded before loading observation points
      setTimeout(async () => {
        await loadObservationPoints();
      }, 100);
      await checkDeleteFeatureFlag();
    };
    
    loadAllData();
  }, [id]);
  
  // Also load data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Farm details screen focused, reloading data...');
      
      // Reset all state to ensure fresh data
      setFarm(null);
      setBoundaryPoints([]);
      setMarkers([]);
      setObservationPoints([]);
      
      // Load all data from scratch with proper sequencing
      const reloadAllData = async () => {
        await loadFarmDetails();
        // Add a small delay to ensure farm data is loaded before loading observation points
        setTimeout(async () => {
          await loadObservationPoints();
        }, 100);
        await checkDeleteFeatureFlag();
      };
      
      reloadAllData();
      
      return () => {
        // Cleanup function when screen goes out of focus
        console.log('Farm details screen unfocused');
      };
    }, [id])
  );
  
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
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.warn('User not found, please sign in again');
        Alert.alert('Error', 'User not found, please sign in again');
        router.back();
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        console.warn('User ID not found, please sign in again');
        Alert.alert('Error', 'User ID not found, please sign in again');
        router.back();
        return;
      }
      
      // Get all farms for the current user and find the one with matching ID
      const farms = await getFarms(userId);
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
      // Trigger a refresh to ensure the observation points are displayed
      setTimeout(() => {
        loadObservationPoints();
      }, 500);
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
      
      // Trigger another refresh to ensure the observation points are displayed
      setTimeout(() => {
        loadObservationPoints();
      }, 500);
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
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
          <PageHeader title="Farm Details" textColor="white" />
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E9762B" />
          <Text className="mt-4 text-base text-[#666]">Loading farm details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!farm) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
          <PageHeader title="Farm Details" textColor="white" />
        </View>
        <View className="flex-1 justify-center items-center p-5">
          <Feather name="alert-circle" size={48} color="#ff4444" />
          <Text className="my-4 text-lg text-red">Farm not found</Text>
          <CustomButton
            title="Go Back"
            handlePress={() => router.back()}
            containerStyles="w-[200px] mt-4"
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader title="Farm Details" textColor="white" />
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Link href="/(tabs)/farm" className="mr-1">
          <Text className="text-sm text-primary font-medium">Farm</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Farm Details</Text>
      </View>
      
      <ScrollView className="p-4">
        <View className="bg-[#f9f9f9] rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-2xl font-pbold text-[#333]">{farm.name}</Text>
          <View className="absolute top-4 right-4 flex-row">            
            {deleteEnabled && (
              <TouchableOpacity 
                onPress={() => setDeleteConfirmVisible(true)} 
                className="p-2"
              >
                <Feather name="trash-2" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="bg-[#f9f9f9] rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-pbold text-[#333]">Farm Boundary</Text>
            <TouchableOpacity
              className="flex-row items-center bg-secondary/10 px-[10px] py-[5px] rounded-md border border-secondary/30"
              onPress={() => router.push({
                pathname: "/(auth)/upload-photos",
                params: { farmId: farm.id }
              })}
            >
              <Feather name="edit-2" size={14} color="#E9762B" />
              <Text className="text-xs font-pbold text-secondary ml-1">Boundary</Text>
            </TouchableOpacity>
          </View>
          {boundaryPoints.length > 0 ? (
            <>
              <BoundaryMap
                points={boundaryPoints}
                observationPoints={observationPoints}
                style={{ width: '100%', height: 200 }}
                showPoints={true}
                numSegments={6}
                boundaryWidth={2}
                segmentFill='rgba(100,150,240,0.2)'
                lineColor='#E9762B'
                lineWidth={1}
                pointColor={'black'}
                onMarkerUpdated={handleMarkersUpdated}
              />
              <Text className="text-sm text-[#666] italic text-center mt-2">
                {boundaryPoints.length} boundary points define this farm's perimeter
              </Text>
            </>
          ) : (
            <Text className="text-base text-[#999] italic text-center my-4">No boundary points defined</Text>
          )}
        </View>
        <View className="bg-[#f9f9f9] rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-pbold text-[#333]">Observation Points</Text>
          </View>
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
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl w-full max-w-[400px] shadow-md overflow-hidden">
            <View className="p-4 border-b border-[#eee]">
              <Text className="text-lg font-pbold text-[#333]">Delete Farm</Text>
            </View>
            
            <View className="p-4 items-center">
              <Feather name="alert-triangle" size={48} color="#ff4444" className="mb-4" />
              <Text className="text-lg font-pbold text-[#333] text-center mb-2">
                Are you sure you want to delete this farm?
              </Text>
              <Text className="text-sm text-[#666] text-center">
                This will permanently delete all farm data, including boundaries, observation points, and observations. This action cannot be undone.
              </Text>
            </View>
            
            <View className="flex-row justify-end p-4 border-t border-[#eee]">
              <TouchableOpacity 
                className="bg-[#f0f0f0] py-[10px] px-4 rounded-lg mr-2"
                onPress={() => setDeleteConfirmVisible(false)}
                disabled={deleting}
              >
                <Text className="text-[#666] text-base font-pbold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-red py-[10px] px-4 rounded-lg"
                onPress={handleDeleteFarm}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-base font-pbold">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


export default FarmDetailsScreen;
