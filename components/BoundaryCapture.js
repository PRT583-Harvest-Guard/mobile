import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Button, Modal, TextInput } from 'react-native';
import { Feather, FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import useBoundaryStore from '@/store/boundaryStore';

const BoundaryCapture = ({ onPointsChange, onSave }) => {
  const [points, setPoints] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isOpenCamera, setIsOpenCamera] = useState(false);
  const [facing, setFacing] = useState('back');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const cameraRef = useRef(null);
  const boundaryStore = useBoundaryStore();

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const newPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        photoUri: photo.uri,
        timestamp: new Date().toISOString(),
        description: '',
      };

      setPoints(prevPoints => [...prevPoints, newPoint]);
      if (onPointsChange) {
        onPointsChange([...points, newPoint]);
      }

      boundaryStore.addPhoto(photo, location);
      setIsOpenCamera(false);
      Alert.alert('Success', 'Point captured successfully');
    } catch (error) {
      console.error('Error capturing point:', error);
      Alert.alert('Error', 'Failed to capture point');
    } finally {
      setIsCapturing(false);
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

  const openModal = (index) => {
    setSelectedPointIndex(index);
    setTempDescription(points[index].description || '');
    setIsModalVisible(true);
  };

  const saveDescription = () => {
    if (selectedPointIndex !== null) {
      const updatedPoints = [...points];
      updatedPoints[selectedPointIndex] = {
        ...updatedPoints[selectedPointIndex],
        description: tempDescription,
      };
      setPoints(updatedPoints);
      if (onPointsChange) {
        onPointsChange(updatedPoints);
      }
    }
    setIsModalVisible(false);
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

      <View style={styles.cameraContainer}>
        {isOpenCamera ? (
          <View style={styles.cameraWrapper}>
            <Camera 
              style={styles.camera} 
              type={facing === 'back' ? Camera.Constants.Type.back : Camera.Constants.Type.front} 
              ref={cameraRef}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity onPress={() => setIsOpenCamera(false)}>
                  <FontAwesome name="arrow-left" size={36} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto}>
                  <FontAwesome6 name="circle-stop" size={48} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}>
                  <FontAwesome name="refresh" size={36} color="white" />
                </TouchableOpacity>
              </View>
            </Camera>
          </View>
        ) : (
          <View style={styles.pointsContainer}>
            {points.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <Image 
                  source={{ uri: point.photoUri }} 
                  style={styles.pointImage}
                />
                <View style={styles.pointInfo}>
                  <Text style={styles.pointText}>
                    Point {index + 1}: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.pointTime}>
                    {new Date(point.timestamp).toLocaleString()}
                  </Text>
                  <TouchableOpacity 
                    style={styles.descriptionButton}
                    onPress={() => openModal(index)}
                  >
                    <FontAwesome name="pencil-square-o" size={16} color="gray" />
                    <Text style={styles.descriptionText}>
                      {point.description || 'Add description...'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.deletePointButton}
                  onPress={() => handleDeletePoint(index)}
                >
                  <FontAwesome5 name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.pointsCount}>
          Total Points: {points.length} {points.length < 3 && '(Minimum 3 points required)'}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title={isOpenCamera ? "Close Camera" : "Open Camera"}
            onPress={() => setIsOpenCamera(!isOpenCamera)}
            color="#007AFF"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Save Boundary"
            onPress={handleSave}
            disabled={points.length < 3}
            color={points.length < 3 ? "#ccc" : "#007AFF"}
          />
        </View>
      </View>

      <Modal 
        visible={isModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Description</Text>
            <TextInput 
              style={styles.modalInput}
              value={tempDescription}
              onChangeText={setTempDescription}
              placeholder="Enter a description..."
            />
            <View style={styles.modalButtons}>
              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={() => setIsModalVisible(false)} color="#666" />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Save" onPress={saveDescription} color="#007AFF" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  cameraContainer: {
    flex: 1,
    marginBottom: 15,
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    height: 500,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'transparent',
  },
  pointsContainer: {
    flex: 1,
    maxHeight: 300,
  },
  pointItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 10,
  },
  pointInfo: {
    flex: 1,
  },
  pointText: {
    fontSize: 14,
    color: '#333',
  },
  pointTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  descriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  descriptionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  deletePointButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'column',
    gap: 10,
  },
  pointsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

export default BoundaryCapture; 