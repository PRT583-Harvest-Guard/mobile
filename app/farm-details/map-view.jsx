import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBoundaryData, getFarms } from '@/services/BoundaryService';
import { PageHeader, BoundaryMap } from '@/components';

const MapViewScreen = () => {
  const { id } = useLocalSearchParams();
  const [farm, setFarm] = useState(null);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFarmDetails();
  }, [id]);

  const loadFarmDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        setError('User not found, please sign in again');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        setError('User ID not found, please sign in again');
        return;
      }
      
      // Get all farms for the current user and find the one with matching ID
      const farms = await getFarms(userId);
      const farmData = farms.find(f => f.id === Number(id) || f.id === id);
      
      if (!farmData) {
        setError('Farm not found');
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
      
      if (!validPoints || validPoints.length < 3) {
        setError('Not enough valid boundary points to display a map');
        return;
      }
      
      setBoundaryPoints(validPoints);
    } catch (error) {
      console.error('Error loading farm details:', error);
      setError('Failed to load farm details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <PageHeader title={farm ? `${farm.name} Map` : "Farm Map"} />
      
      <View className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center p-5">
            <Text className="text-lg text-[#666]">Loading map...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-5">
            <Feather name="alert-circle" size={48} color="#ff4444" />
            <Text className="text-lg text-red my-4 text-center">{error}</Text>
            <TouchableOpacity 
              className="bg-secondary py-3 px-6 rounded-lg mt-4"
              onPress={() => router.back()}
            >
              <Text className="text-white font-pbold text-base">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <BoundaryMap 
              points={boundaryPoints}
              style={{ 
                width: '100%', 
                height: '70%', 
                backgroundColor: '#f9f9f9',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              showPoints={true}
              lineWidth={3}
              pointRadius={6}
            />
            
            <View className="w-full bg-[#f9f9f9] rounded-xl p-4 mt-4 shadow-sm">
              <Text className="text-xl font-pbold text-[#333] mb-2">{farm.name}</Text>
              <Text className="text-base text-[#666] mb-1">
                Size: {farm.size ? `${farm.size} acres` : 'Not specified'}
              </Text>
              {farm.plant_type && (
                <Text className="text-base text-[#666] mb-1">
                  Plants: {farm.plant_type}
                </Text>
              )}
              <Text className="text-sm text-[#666] italic mt-2">
                {boundaryPoints.length} boundary points define this farm's perimeter
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};


export default MapViewScreen;
