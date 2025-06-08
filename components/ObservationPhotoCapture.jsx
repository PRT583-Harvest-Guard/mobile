import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const ObservationPhotoCapture = ({ onPhotoCapture }) => {
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const takePicture = async () => {
    setLoading(true);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        
        // Save the photo to a more permanent location
        const fileName = `observation_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newUri
        });
        
        setPhotoUri(newUri);
        
        // Call the callback with the photo URI
        if (onPhotoCapture) {
          onPhotoCapture(newUri);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Save the photo to a more permanent location
        const fileName = `observation_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: newUri
        });
        
        setPhotoUri(newUri);
        
        // Call the callback with the photo URI
        if (onPhotoCapture) {
          onPhotoCapture(newUri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    if (onPhotoCapture) {
      onPhotoCapture(null);
    }
  };


  return (
    <View className="mb-4">
      {photoUri ? (
        <View className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-4 relative">
          <Image source={{ uri: photoUri }} className="w-full h-full" />
          <TouchableOpacity 
            className="absolute top-[10px] right-[10px] w-[36px] h-[36px] rounded-full bg-red/70 justify-center items-center"
            onPress={removePhoto}
          >
            <Feather name="trash-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row justify-between">
          <TouchableOpacity 
            className="flex-row items-center justify-center bg-secondary py-3 px-4 rounded-lg flex-1 mr-2"
            onPress={takePicture}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="camera" size={20} color="#fff" className="mr-2" />
                <Text className="text-white text-base font-pbold">Take Photo</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center justify-center bg-white py-3 px-4 rounded-lg flex-1 ml-2 border border-secondary"
            onPress={pickImage}
            disabled={loading}
          >
            <Feather name="image" size={20} color="#E9762B" className="mr-2" />
            <Text className="text-secondary text-base font-pbold">Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


export default ObservationPhotoCapture;
