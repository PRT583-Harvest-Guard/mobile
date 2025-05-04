import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={pickImage}
          >
            <Feather name="edit" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removePhoto}
          >
            <Feather name="trash-2" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholder}>
            <Feather name="user" size={60} color="#ccc" />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={takePicture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="camera" size={16} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Camera</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.galleryButton]}
              onPress={pickImage}
              disabled={loading}
            >
              <Feather name="image" size={16} color="#E9762B" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, styles.galleryButtonText]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 30,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9762B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9762B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9762B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  galleryButtonText: {
    color: '#E9762B',
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default ProfilePhotoCapture;
