import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getFarms, getBoundaryData } from '@/services/BoundaryService';
import { CustomButton, PageHeader, BoundaryMap, MapSections } from '@/components';

const FarmDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [farm, setFarm] = useState(null);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [loading, setLoading] = useState(true);


  const boundiPoints = [
    { latitude: 37.773972, longitude: -122.431297 }, // Point 1 (North-West)
    { latitude: 37.773972, longitude: -122.426297 }, // Point 2 (North-East)
    { latitude: 37.768972, longitude: -122.426297 }, // Point 3 (South-East)
    { latitude: 37.768972, longitude: -122.431297 }, // Point 4 (South-West)
  ];
  useEffect(() => {
    loadFarmDetails();
  }, [id]);

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

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Farm Details" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.farmName}>{farm.name}</Text>
          <TouchableOpacity onPress={handleEditFarm} style={styles.editButton}>
            <Feather name="edit" size={24} color="#E9762B" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Farm Boundary</Text>
          {boundiPoints.length > 0 ? (
            <>
              <BoundaryMap
                points={boundiPoints}
                style={styles.boundaryMap}
                showPoints={true}
              />
              <Text style={styles.boundaryInfoText}>
                {boundiPoints.length} boundary points define this farm's perimeter
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No boundary points defined</Text>
          )}
        </View>
        <View style={styles.card}>
        <MapSections points={boundiPoints} />
        </View>
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
  boundaryMap: {
    width: '100%',
    height: 200,
  },
  boundaryInfoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
});

export default FarmDetailsScreen;
