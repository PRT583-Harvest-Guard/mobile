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
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removePhoto}
          >
            <Feather name="trash-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
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
                <Feather name="camera" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Take Photo</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.galleryButton]}
            onPress={pickImage}
            disabled={loading}
          >
            <Feather name="image" size={20} color="#E9762B" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.galleryButtonText]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9762B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9762B',
    marginRight: 0,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryButtonText: {
    color: '#E9762B',
  },
  buttonIcon: {
    marginRight: 8,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ObservationPhotoCapture;
