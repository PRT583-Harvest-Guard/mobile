import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { createFarm, getFarms, deleteFarm, updateFarm } from '@/services/BoundaryService';
import { CustomButton, FormField } from '@/components';
import { Feather } from '@expo/vector-icons';

const FarmScreen = () => {
  const [farms, setFarms] = useState([]);
  const [newFarm, setNewFarm] = useState({
    name: '',
    size: '',
    plant_type: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const farmList = await getFarms();
      setFarms(farmList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load farms');
    }
  };

  const handleCreateFarm = async () => {
    if (!newFarm.name) {
      Alert.alert('Error', 'Farm name is required');
      return;
    }

    setIsLoading(true);
    try {
      await createFarm({
        name: newFarm.name,
        size: parseFloat(newFarm.size) || null,
        plant_type: newFarm.plant_type || null
      });
      setNewFarm({ name: '', size: '', plant_type: '' });
      await loadFarms();
    } catch (error) {
      Alert.alert('Error', 'Failed to create farm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFarm = async (farmId) => {
    Alert.alert(
      'Delete Farm',
      'Are you sure you want to delete this farm?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFarm(farmId);
              await loadFarms();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete farm');
            }
          },
        },
      ]
    );
  };

  const handleEditFarm = (farm) => {
    setEditingFarm(farm);
    setNewFarm({
      name: farm.name,
      size: farm.size?.toString() || '',
      plant_type: farm.plant_type || ''
    });
  };

  const handleUpdateFarm = async () => {
    if (!newFarm.name) {
      Alert.alert('Error', 'Farm name is required');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Current form values:', newFarm);
      
      // Ensure we're passing the correct data types
      const updateData = {
        name: newFarm.name.trim(),
        size: newFarm.size ? Number(newFarm.size) : null,
        plant_type: newFarm.plant_type ? newFarm.plant_type.trim() : null
      };
      
      console.log('Update data being sent:', updateData);
      
      const updatedFarm = await updateFarm(editingFarm.id, updateData);
      console.log('Farm updated successfully:', updatedFarm);
      
      // Reset form and state
      setNewFarm({ name: '', size: '', plant_type: '' });
      setEditingFarm(null);
      
      // Refresh the farms list
      await loadFarms();
      
      Alert.alert('Success', 'Farm updated successfully');
    } catch (error) {
      console.error('Update farm error:', error);
      Alert.alert('Error', error.message || 'Failed to update farm');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFarmItem = ({ item }) => (
    <TouchableOpacity
      style={styles.farmItem}
      onPress={() => router.push(`/farm-details/${item.id}`)}
    >
      <View style={styles.farmInfo}>
        <Text style={styles.farmName}>{item.name}</Text>
        <Text style={styles.farmDetails}>
          {item.size ? `Size: ${item.size} acres` : 'Size: Not specified'}
        </Text>
        <Text style={styles.farmDetails}>
          {item.plant_type ? `Plants: ${item.plant_type}` : 'Plants: Not specified'}
        </Text>
      </View>
      <View style={styles.farmActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditFarm(item)}
        >
          <Feather name="edit" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteFarm(item.id)}
        >
          <Feather name="trash-2" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {editingFarm ? 'Edit Farm' : 'Create New Farm'}
        </Text>
        
        <FormField
          title="Farm Name"
          titleStyles="text-black"
          value={newFarm.name}
          handleTextChange={(text) => setNewFarm({ ...newFarm, name: text })}
        />
        
        <FormField
          title="Size (acres)"
          titleStyles="text-black"
          value={newFarm.size}
          handleTextChange={(text) => setNewFarm({ ...newFarm, size: text })}
          keyboardType="numeric"
        />
        
        <FormField
          title="Type of Plants"
          titleStyles="text-black"
          value={newFarm.plant_type}
          handleTextChange={(text) => setNewFarm({ ...newFarm, plant_type: text })}
        />
        
        <View style={styles.buttonContainer}>
          {editingFarm && (
            <CustomButton
              title="Cancel"
              handlePress={() => {
                setEditingFarm(null);
                setNewFarm({ name: '', size: '', plant_type: '' });
              }}
              containerStyles={styles.cancelButton}
              theme="secondary"
            />
          )}
          <CustomButton
            title={editingFarm ? "Update Farm" : "Create Farm"}
            handlePress={editingFarm ? handleUpdateFarm : handleCreateFarm}
            isLoading={isLoading}
            containerStyles={styles.createButton}
          />
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Your Farms</Text>
        <FlatList
          data={farms}
          renderItem={renderFarmItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
};

FarmScreen.displayName = 'FarmScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  createButton: {
    flex: 1,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  farmItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmInfo: {
    flex: 1,
  },
  farmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  farmDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default FarmScreen; 