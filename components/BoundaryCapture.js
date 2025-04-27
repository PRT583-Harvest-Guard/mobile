import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CustomButton } from './CustomButton';

const BoundaryCapture = ({ onPointsChange, onSave }) => {
  const [points, setPoints] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleAddPoint = (latitude, longitude) => {
    const newPoint = { latitude, longitude };
    setPoints(prevPoints => [...prevPoints, newPoint]);
    if (onPointsChange) {
      onPointsChange([...points, newPoint]);
    }
  };

  const handleDeletePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    if (onPointsChange) {
      onPointsChange(newPoints);
    }
  };

  const handleSave = async () => {
    if (points.length < 3) {
      Alert.alert('Error', 'Cannot form a boundary with less than three points');
      return;
    }

    try {
      await onSave(points);
      setPoints([]);
      Alert.alert('Success', 'Boundary points saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save boundary points');
    }
  };

  const handleClear = () => {
    setPoints([]);
    if (onPointsChange) {
      onPointsChange([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Boundary Points</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClear}
            disabled={points.length === 0}
          >
            <Feather name="trash-2" size={20} color={points.length === 0 ? '#ccc' : '#ff4444'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        {points.map((point, index) => (
          <View key={index} style={styles.pointItem}>
            <Text style={styles.pointText}>
              Point {index + 1}: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity
              style={styles.deletePointButton}
              onPress={() => handleDeletePoint(index)}
            >
              <Feather name="x" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.pointsCount}>
          Total Points: {points.length} {points.length < 3 && '(Minimum 3 points required)'}
        </Text>
        <CustomButton
          title="Save Boundary"
          handlePress={handleSave}
          disabled={points.length < 3}
          containerStyles={styles.saveButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  pointsContainer: {
    flex: 1,
    maxHeight: 200,
    marginBottom: 15,
  },
  pointItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deletePointButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCount: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    flex: 0.6,
  },
});

export default BoundaryCapture; 