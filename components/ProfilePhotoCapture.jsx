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

const ProfilePhotoCapture = ({ photoUri, onPhotoCapture }) => {
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
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        
        // Save the photo to a more permanent location
        const fileName = `profile_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newUri
        });
        
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
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Save the photo to a more permanent location
        const fileName = `profile_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: newUri
        });
        
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
    if (onPhotoCapture) {
      onPhotoCapture(null);
    }
  };

  return (
    <View className="items-center mb-5">
      {photoUri ? (
        <View className="items-center">
          <View className="w-[120px] h-[120px] rounded-full overflow-hidden mb-3">
            <Image source={{ uri: photoUri }} className="w-full h-full" />
          </View>
          <View className="flex-row justify-center space-x-24">
            <TouchableOpacity 
              className="w-[40px] h-[40px] rounded-full bg-secondary justify-center items-center"
              onPress={pickImage}
            >
              <Feather name="edit" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-[40px] h-[40px] rounded-full bg-[#ff3333] justify-center items-center"
              onPress={removePhoto}
            >
              <Feather name="trash-2" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center">
          <View className="w-[120px] h-[120px] rounded-full bg-[#f0f0f0] justify-center items-center mb-4">
            <Feather name="user" size={60} color="#ccc" />
          </View>
          <View className="flex-row justify-center">
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-secondary py-2 px-3 rounded-lg mx-1"
              onPress={takePicture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="camera" size={16} color="#fff" className="mr-1" />
                  <Text className="text-white text-sm font-pbold">Camera</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-white py-2 px-3 rounded-lg mx-1 border border-secondary"
              onPress={pickImage}
              disabled={loading}
            >
              <Feather name="image" size={16} color="#E9762B" className="mr-1" />
              <Text className="text-secondary text-sm font-pbold">Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};


export default ProfilePhotoCapture;
