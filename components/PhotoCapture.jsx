import React, { useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import CustomButton from './CustomButton'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import LoadingIndicator from './LoadingIndicator'
import { saveBoundaryData, deleteAllBoundaryPoints, updateBoundaryPoint, getBoundaryData, saveBoundaryPoint } from '@/services/BoundaryService'
import useBoundaryStore from '@/store/boundaryStore'

const PhotoCapture = ({ title, titleStyles, farmId }) => {
  const [facing, setFacing] = useState('back')
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions()
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [isOpenCamera, setIsOpenCamera] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(null)
  const [tempDescription, setTempDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const cameraRef = useRef(null)
  const boundaryStore = useBoundaryStore()

  const checkPermission = async () => {
    try {
      // Request camera permission if not already granted
      if (!cameraPermission?.granted) {
        const cameraResult = await requestCameraPermission()
        if (!cameraResult.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is needed to capture boundary points. Please enable camera access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          )
          return false
        }
      }
      
      // Request location permission if not already granted
      if (!locationPermission?.granted) {
        const locationResult = await requestLocationPermission()
        if (!locationResult.granted) {
          Alert.alert(
            'Location Permission Required',
            'Location access is needed to record the position of boundary points. Please enable location access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          )
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error checking permissions:', error)
      Alert.alert('Error', 'Failed to check permissions. Please try again.')
      return false
    }
  }

  useEffect(() => { 
    loadExistingPoints()
  }, [])

  const loadExistingPoints = async () => {
    if (!farmId) return
    setIsLoading(true)
    try {
      const points = await getBoundaryData(farmId)
      if (points && Array.isArray(points)) {
        // Convert points to photo format
        const photos = points.map(point => ({
          uri: point.photo_uri,
          location: {
            latitude: point.latitude,
            longitude: point.longitude
          },
          timestamp: point.timestamp,
          description: point.description
        }))
        boundaryStore.setPhotos(photos)
      }
    } catch (error) {
      console.error('Error loading existing points:', error)
      Alert.alert('Error', 'Failed to load existing boundary points')
    } finally {
      setIsLoading(false)
    }
  }

  const takePhoto = async () => {
    setIsCapturing(true)
    try {
      if (!cameraRef.current) {
        throw new Error('Camera not initialized')
      }

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 })
      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo')
      }

      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      })
      
      if (!location || !location.coords) {
        throw new Error('Failed to get location')
      }

      const newPoint = {
        uri: photo.uri,
        location: { 
          latitude: location.coords.latitude, 
          longitude: location.coords.longitude 
        },
        description: null,
        timestamp: new Date().toISOString()
      }

      // Save to database first
      await saveBoundaryPoint(farmId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        photoUri: photo.uri,
        timestamp: newPoint.timestamp,
        description: null
      })

      // Then update store
      boundaryStore.addPhoto(photo, location)

      // Show success message
      Alert.alert('Success', 'Photo captured and saved successfully')

      // Show warning if less than 3 points
      if (boundaryStore.photos.length < 3) {
        Alert.alert(
          'Warning',
          `You need ${3 - boundaryStore.photos.length} more points to form a boundary.`,
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Capture error:', error)
      Alert.alert('Error', error.message || 'Failed to capture and save photo')
    } finally {
      setIsCapturing(false)
      setIsOpenCamera(false)
    }
  }

  const deletePhoto = async index => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              const photos = boundaryStore.photos
              const photoToDelete = photos[index]
              // Delete from database
              await deleteAllBoundaryPoints(farmId)
              // Update store
              const updatedPhotos = photos.filter((_, i) => i !== index)
              boundaryStore.setPhotos(updatedPhotos)
              Alert.alert('Success', 'Photo deleted successfully')
            } catch (error) {
              console.error('Delete error:', error)
              Alert.alert('Error', 'Failed to delete photo. Please try again.')
            }
          }
        },
      ]
    )
  }

  const openModal = index => {
    setCurrentIndex(index)
    setTempDescription(boundaryStore.photos[index]?.description || '')
    setIsModalVisible(true)
  }

  const saveDescription = async () => {
    if (currentIndex != null) {
      try {
        const photos = boundaryStore.photos
        const photoToUpdate = photos[currentIndex]
        // Update in database
        await updateBoundaryPoint(photoToUpdate.id, tempDescription)
        // Update store
        const updated = [...photos]
        updated[currentIndex] = {
          ...updated[currentIndex],
          description: tempDescription
        }
        boundaryStore.setPhotos(updated)
      } catch (error) {
        Alert.alert('Error', 'Failed to update description.')
      }
    }
    setIsModalVisible(false)
  }

  if (!cameraPermission?.granted || !locationPermission?.granted) {
    return (
      <View className="w-full items-center">
        <Text className="text-red-500 text-lg text-center">
          Camera and Location access are required.
        </Text>
        <CustomButton title="Grant Permissions" handlePress={checkPermission} />
      </View>
    )
  }

  return (
    <View className="w-full h-full">
      <LoadingIndicator isLoading={isLoading || isCapturing} />

      {isOpenCamera ? (
        <CameraView style={{ width: '100%', height: 500 }} facing={facing} ref={cameraRef}>
          <View className="flex-1 flex-row items-end justify-between bg-transparent m-8">
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
        </CameraView>
      ) : (
        <View className="w-full h-full flex-col items-center justify-center">
          <Text className={`w-full text-2xl font-psemibold text-center mb-5 ${titleStyles}`}>{title}</Text>
          <CustomButton 
            title="Capture Points" 
            handlePress={async () => {
              const permissionsGranted = await checkPermission()
              if (permissionsGranted) {
                setIsOpenCamera(true)
              }
            }}
            isLoading={isCapturing}
            containerStyles="px-8 py-4"
            textStyles="text-lg"
            icon={<FontAwesome5 name="camera" size={20} color="white" style={{ marginLeft: 10 }} />}
          />

          {boundaryStore.photos.length > 0 && (
            <FlatList
              data={boundaryStore.photos}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View className="w-full items-center justify-center p-2 border-b-2 border-secondary">
                  <View className="w-full flex-row items-end justify-between">
                    <Image source={{ uri: item.uri }} className="w-[50px] h-[50px] rounded-lg" />
                    <Text className="text-gray-900 text-sm font-plight">
                      {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity onPress={() => deletePhoto(index)}>
                      <FontAwesome5 name="trash" size={24} color="#bb0000" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity className="w-full flex-row items-center justify-center p-1 border-2 border-black/30 rounded-lg gap-2 mt-4" onPress={() => openModal(index)}>
                    <FontAwesome name="pencil-square-o" size={24} color="gray" />
                    <Text className={`flex-1 font-pregular text-base ${item.description ? 'text-black' : 'text-gray-500'}`}>
                      {item.description || 'Describe your photo ...'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      <Modal 
        visible={isModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-4/5 bg-white p-5 rounded-lg">
            <Text className="text-lg font-psemibold mb-4">Edit Description</Text>
            <TextInput 
              className="w-full border border-gray-300 rounded-lg p-2 text-black"
              value={tempDescription}
              onChangeText={setTempDescription}
              placeholder="Enter a description..."
            />
            <View className="flex-row justify-end mt-4">
              <CustomButton title="Cancel" handlePress={() => setIsModalVisible(false)} />
              <CustomButton title="Save" handlePress={saveDescription} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default PhotoCapture
