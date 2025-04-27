import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  Alert,
  Button,
} from 'react-native'
import { Camera } from 'expo-camera'
import * as Location from 'expo-location'
import { useLocalSearchParams } from 'expo-router'
import { getBoundaryData, saveBoundaryPoint } from '@/services/BoundaryService'

export default function UploadBoundaryScreen() {
  const { farmId } = useLocalSearchParams()
  const [points, setPoints] = useState([])
  const [modalVisible, setModalVisible] = useState(false)

  // Load existing boundary points on mount
  useEffect(() => {
    (async () => {
      try {
        const existing = await getBoundaryData(farmId)
        if (existing && existing.length) {
          const formatted = existing.map(p => ({
            uri: p.photoUri,
            latitude: p.latitude,
            longitude: p.longitude,
            timestamp: p.timestamp,
          }))
          setPoints(formatted)
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load boundary points.')
      }
    })()
  }, [farmId])

  const handlePhotoCaptured = async point => {
    // Update local state
    setPoints(prev => [...prev, point])
    // Persist to backend
    try {
      await saveBoundaryPoint(farmId, {
        photoUri: point.uri,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp,
      })
    } catch {
      Alert.alert('Error', 'Failed to save point.')
    }
    setModalVisible(false)
  }

  return (
    <View style={styles.container}>
      {/* Single boundary points card */}
      <View style={styles.card}>
        <Text style={styles.header}>Boundary Points</Text>
        {points.length === 0 ? (
          <Text style={styles.emptyText}>No existing points for this farm.</Text>
        ) : (
          <FlatList
            data={points}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View style={styles.pointRow}>
                <Text style={styles.pointIndex}>Point {index + 1}:</Text>
                <Text style={styles.coords}>
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Capture button */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.captureText}>Capture Point</Text>
      </TouchableOpacity>

      <CameraModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </View>
  )
}

function CameraModal({ visible, onClose, onPhotoCaptured }) {
  const [hasCamPerm, setHasCamPerm] = useState(null)
  const [hasLocPerm, setHasLocPerm] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const cameraRef = useRef(null)

  useEffect(() => {
    if (visible) {
      (async () => {
        const cam = await Camera.requestCameraPermissionsAsync()
        setHasCamPerm(cam.status === 'granted')
        const loc = await Location.requestForegroundPermissionsAsync()
        setHasLocPerm(loc.status === 'granted')
      })()
    }
  }, [visible])

  const takePicture = async () => {
    if (!cameraRef.current) return
    setIsCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 })
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation })
      const point = {
        uri: photo.uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      }
      onPhotoCaptured(point)
    } catch {
      Alert.alert('Error', 'Failed to capture photo or location.')
      setIsCapturing(false)
    }
  }

  if (!visible) return null

  if (hasCamPerm === false || hasLocPerm === false)
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>Camera and location permissions are required.</Text>
          <Button title="Close" onPress={onClose} />
        </View>
      </Modal>
    )

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <Camera style={styles.camera} ref={cameraRef} />
        <View style={styles.modalButtons}>
          <Button title={isCapturing ? 'Capturing...' : 'Take Photo'} onPress={takePicture} disabled={isCapturing} />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({

  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { fontSize: 16, fontStyle: 'italic', color: '#666' },
  list: { paddingBottom: 16 },
  card: { marginBottom: 12, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  pointIndex: { fontWeight: 'bold', marginBottom: 8 },
  thumbnail: { width: '100%', height: 150, borderRadius: 4, marginBottom: 8 },
  coords: { color: '#333' },
  captureButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  captureText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  camera: { width: '90%', height: '70%', borderRadius: 8, overflow: 'hidden' },
  modalButtons: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-around', width: '90%' },
  modalText: { color: '#fff', marginBottom: 12, textAlign: 'center' },
})
