import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
      
      // Get all farms and find the one with matching ID
      const farms = await getFarms();
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
    <SafeAreaView style={styles.container}>
      <PageHeader title={farm ? `${farm.name} Map` : "Farm Map"} />
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Feather name="alert-circle" size={48} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <BoundaryMap 
              points={boundaryPoints}
              style={styles.map}
              showPoints={true}
              lineWidth={3}
              pointRadius={6}
            />
            
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>{farm.name}</Text>
              <Text style={styles.infoText}>
                Size: {farm.size ? `${farm.size} acres` : 'Not specified'}
              </Text>
              {farm.plant_type && (
                <Text style={styles.infoText}>
                  Plants: {farm.plant_type}
                </Text>
              )}
              <Text style={styles.boundaryText}>
                {boundaryPoints.length} boundary points define this farm's perimeter
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginVertical: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#E9762B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
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
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  boundaryText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default MapViewScreen;
