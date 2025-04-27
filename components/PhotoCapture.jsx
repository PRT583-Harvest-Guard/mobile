import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from "expo-camera"
import * as Location from "expo-location"
import CustomButton from './CustomButton'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import LoadingIndicator from './LoadingIndicator'

const PhotoCapture = ({ photos, setPhotos, title, titleStyles }) => {
  const [facing, setFacing] = useState('back');
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isOpenCamera, setIsOpenCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [tempDescription, setTempDescription] = useState('');
  const cameraRef = useRef(null);


  const checkPermission = async () => {
    if (!cameraPermission) await requestCameraPermission();
    if (!locationPermission) await requestLocationPermission();
  }

  useEffect(() => {
    checkPermission();
  }, []);

  const requestPermissionsAgain = async () => {
    await checkPermission();
    if (cameraPermission?.status !== 'granted' || locationPermission?.status !== 'granted') {
      Alert.alert(
        "Permissions Required",
        "Please enable camera and location permissions in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const toggleCamera = () => setIsOpenCamera(!isOpenCamera);

  const takePhoto = async () => {
    setIsCapturing(true);
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        const location = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newPhoto = {
          uri: photo.uri,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          description: null
        };
        setPhotos([...photos, newPhoto]);
      } catch (error) {
        Alert.alert("Error", "Failed to capture photo.");
      } finally {
        setIsCapturing(false);
        setIsOpenCamera(false);
      }
    } else {
      Alert.alert("Error", "Camera is not available.");
      setIsCapturing(false);
      setIsOpenCamera(false);
    }
  }

  const deletePhoto = (index) => {
    Alert.alert(
      "Confirm Deletetion",
      "Are you sure you want to delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel"
        }, {
          text: "Confirm",
          onPress: () => {
            setPhotos(photos.filter((_, i) => i != index));
          }
        }
      ]
    )
  }

  const openModal = (index) => {
    setCurrentIndex(index);
    setTempDescription(photos[index].description || '');
    setIsModalVisible(true);
  }

  const saveDescription = () => {
    if (currentIndex != null) {
      updateDescription(currentIndex, tempDescription)
    }
    setIsModalVisible(false);
  }

  const updateDescription = (index, text) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].description = text;
    setPhotos(updatedPhotos);
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const roundDecimals = (num, d) => {
    const digit = Math.pow(10, d);
    return Math.round(num * digit) / digit;
  }

  if (!cameraPermission || !locationPermission) {
    return <Text className="text-secondary text-2xl font-psemibold">Requesting permissions ...</Text>;
  }

  if (!cameraPermission.granted || !locationPermission.granted) {
    return (
      <View className="w-full items-center">
        <Text className="text-red-500 text-lg text-center">
          Camera and Location access are required.
        </Text>
        <CustomButton title="Grant Permissions" handlePress={requestPermissionsAgain} />
      </View>
    );
  }

  return (
    <View className='w-full h-full'>
      <LoadingIndicator isLoading={isCapturing} />

      {isOpenCamera && (
        <CameraView style={{ width: "100%", height: 500 }} facing={facing} ref={cameraRef}>
          <View className="flex-1 flex-row items-end justify-between bg-transparent m-8 relative">
            <TouchableOpacity onPress={toggleCamera}>
              <FontAwesome name="arrow-left" size={36} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto}>
              <FontAwesome6 name="circle-stop" size={48} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing}>
              <FontAwesome name="refresh" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {!isOpenCamera && (
        <View className='w-full h-full flex-col items-center justify-center'>
          <Text className={`w-full text-2xl font-psemibold text-center mb-5 ${titleStyles}`}>{title}</Text>

          <CustomButton
            title="Take Photo"
            containerStyles="w-full mb-5"
            handlePress={toggleCamera}
            isLoading={isCapturing}
          />

          {photos.length > 0 && (
            <FlatList
              data={photos}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View className='w-full items-center justify-center p-2 border-b-2 border-secondary'>
                  <View className='w-full flex-row items-end justify-between'>
                    <Image source={{ uri: item.uri }} className='w-[50px] h-[50px] rounded-lg' />
                    <Text className='text-gray-900 text-sm font-plight'>
                      {roundDecimals(item.location.latitude, 6)}, {roundDecimals(item.location.longitude, 6)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deletePhoto(index)}
                    >
                      <FontAwesome5 name="trash" size={24} color="#bb0000" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className='w-full flex-row items-center justify-center p-1 border-2 border-black/30 rounded-lg gap-2 mt-4'
                    onPress={() => openModal(index)}
                  >
                    <FontAwesome name="pencil-square-o" size={24} color="gray" />
                    <Text
                      className={`flex-1 font-pregular text-base ${photos[index].description ? 'text-black' : 'text-gray-500'}`}
                    >
                      {photos[index].description || 'Describe your photo ...'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                backgroundColor: "#fff",
                borderWidth: 2,
                borderColor: "#E9762B",
                borderRadius: 16,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            />
          )}

          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType='slide'
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
                  autoCapitalize="none"
                  autoFocus
                  
                />
                <View className="flex-row justify-end mt-4">
                  <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                  <Button title="Save" onPress={saveDescription} />
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
