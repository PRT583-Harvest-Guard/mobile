import React, { useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import CustomButton from './CustomButton'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import LoadingIndicator from './LoadingIndicator'

const PhotoCapture = ({ photos, onCapture, title, titleStyles }) => {
  const [facing, setFacing] = useState('back')
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions()
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [isOpenCamera, setIsOpenCamera] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(null)
  const [tempDescription, setTempDescription] = useState('')
  const cameraRef = useRef(null)

  const checkPermission = async () => {
    if (!cameraPermission) await requestCameraPermission()
    if (!locationPermission) await requestLocationPermission()
  }

  useEffect(() => { checkPermission() }, [])

  const takePhoto = async () => {
    setIsCapturing(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 })
      const location = (await Location.getLastKnownPositionAsync()) || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
      const newPhoto = {
        uri: photo.uri,
        location: { latitude: location.coords.latitude, longitude: location.coords.longitude },
        description: null,
      }
      onCapture(newPhoto)
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo.')
    } finally {
      setIsCapturing(false)
      setIsOpenCamera(false)
    }
  }

  const deletePhoto = index => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onCapture(photos.filter((_, i) => i !== index)) },
      ]
    )
  }

  const openModal = index => {
    setCurrentIndex(index)
    setTempDescription(photos[index]?.description || '')
    setIsModalVisible(true)
  }

  const saveDescription = () => {
    if (currentIndex != null) {
      const updated = [...photos]
      updated[currentIndex].description = tempDescription
      onCapture(updated)
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
      <LoadingIndicator isLoading={isCapturing} />

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
          <CustomButton title="Take Photo" handlePress={() => setIsOpenCamera(true)} isLoading={isCapturing} />

          {photos.length > 0 && (
            <FlatList
              data={photos}
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

          <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="w-4/5 bg-white p-5 rounded-lg">
                <Text className="text-lg font-psemibold mb-4">Edit Description</Text>
                <TextInput className="w-full border border-gray-300 rounded-lg p-2 text-black" value={tempDescription} onChangeText={setTempDescription} placeholder="Enter a description..." />
                <View className="flex-row justify-end mt-4">
                  <CustomButton title="Cancel" handlePress={() => setIsModalVisible(false)} />
                  <CustomButton title="Save" handlePress={saveDescription} />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  )
}

export default PhotoCapture;