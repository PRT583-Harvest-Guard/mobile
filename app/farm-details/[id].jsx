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


  // Sample boundary points in case the API doesn't return any
  const sampleBoundaryPoints = [
    { latitude: -33.8731, longitude: 151.2111 }, // Point A
    { latitude: -33.8720, longitude: 151.2135 }, // Point B
    { latitude: -33.8735, longitude: 151.2160 }, // Point C
    { latitude: -33.8750, longitude: 151.2140 }, // Point D
    { latitude: -33.8742, longitude: 151.2115 }  // Point E
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
          {sampleBoundaryPoints .length > 0 ? (
            <>
              <BoundaryMap
                points={sampleBoundaryPoints }
                style={styles.boundaryMap}
                showPoints={true}
              />
              <Text style={styles.boundaryInfoText}>
                {sampleBoundaryPoints.length} boundary points define this farm's perimeter
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No boundary points defined</Text>
          )}
        </View>
        <View style={styles.card}>
        <MapSections points={sampleBoundaryPoints.length > 0 ? sampleBoundaryPoints : sampleBoundaryPoints} />
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
  farmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
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
});

export default FarmDetailsScreen;
