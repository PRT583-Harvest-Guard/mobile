import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getFarms, getBoundaryData } from '@/services/BoundaryService';
import { CustomButton, PageHeader } from '@/components';

const FarmDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [farm, setFarm] = useState(null);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setBoundaryPoints(points);
    } catch (error) {
      console.error('Error loading farm details:', error);
      Alert.alert('Error', 'Failed to load farm details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFarm = () => {
    // Navigate back to the farm screen with edit mode
    // This is a placeholder - you would need to implement the actual navigation
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
          <View style={styles.header}>
            <Text style={styles.farmName}>{farm.name}</Text>
            <TouchableOpacity onPress={handleEditFarm} style={styles.editButton}>
              <Feather name="edit" size={24} color="#E9762B" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Feather name="map-pin" size={20} color="#666" />
            <Text style={styles.detailLabel}>Size:</Text>
            <Text style={styles.detailValue}>
              {farm.size ? `${farm.size} acres` : 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Feather name="grid" size={20} color="#666" />
            <Text style={styles.detailLabel}>Plant Type:</Text>
            <Text style={styles.detailValue}>
              {farm.plant_type || 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Feather name="calendar" size={20} color="#666" />
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(farm.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Boundary Points</Text>
          {boundaryPoints.length > 0 ? (
            <View style={styles.boundaryContainer}>
              {boundaryPoints.map((point, index) => (
                <View key={index} style={styles.boundaryPoint}>
                  <Text style={styles.pointIndex}>{index + 1}</Text>
                  <Text style={styles.pointCoords}>
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No boundary points defined</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="View on Map"
            handlePress={() => {
              // This would navigate to a map view
              Alert.alert('Map View', 'Map view not implemented yet');
            }}
            containerStyles={styles.button}
          />
          
          <CustomButton
            title="Add Boundary Points"
            handlePress={() => {
              router.push({
                pathname: "/(auth)/upload-photos",
                params: { farmId: farm.id }
              });
            }}
            containerStyles={styles.button}
            theme="secondary"
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  farmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  boundaryContainer: {
    marginTop: 8,
  },
  boundaryPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pointIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9762B',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    marginRight: 12,
  },
  pointCoords: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
  },
});

export default FarmDetailsScreen;
