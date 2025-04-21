import { CustomButton, Logo, PhotoCapture } from '@/components'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { saveBoundaryData } from '@/services/BoundaryService'

const UploadPhotos = () => {
  const requiredPhotoNum = 20;
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);

  // Request location permissions
  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to map your property boundary.');
        return;
      }
    })();
  }, []);

  const handlePhotoCapture = async (newPhoto) => {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Add photo with location data
      const photoWithLocation = {
        uri: newPhoto.uri,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        timestamp: new Date().toISOString(),
      };

      setPhotos(prev => [...prev, photoWithLocation]);
      setBoundaryPoints(prev => [...prev, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please ensure location services are enabled.');
    }
  };

  const save = async () => {
    setIsSubmitting(true);
    try {
      await saveBoundaryData(boundaryPoints);
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const submit = async () => {
    if (photos.length < requiredPhotoNum) {
      Alert.alert("Error", `Please Upload at least ${requiredPhotoNum} photos at the border of your property!`);
      return;
    }

    setIsSubmitting(true);
    try {
      await saveBoundaryData(boundaryPoints);
      Alert.alert("Success", "Photos and boundary data uploaded successfully!");
      router.replace("/(tabs)/farm-layout");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-primary h-full'>
      <View className='w-full h-full flex-col items-center justify-center gap-5 px-4'>
        {/* Logo */}
        <View className="w-full items-center justify-center">
          <Logo containerStyles="w-32 h-32" />
        </View>
        
        {/* Photo Uploading Component */}
        <View className='w-full flex-1'>
          <PhotoCapture
            title={`Please Upload at least ${requiredPhotoNum} photos at the border of your property `}
            titleStyles='text-white'
            photos={photos}
            setPhotos={handlePhotoCapture}
          />
        </View>

        {/* Buttons */}
        <View className='w-full pb-4 px-4'>
          <CustomButton
            title="Save"
            handlePress={save}
            containerStyles="w-full mb-7"
            isLoading={isSubmitting}
          />
          <CustomButton
            title={photos.length === requiredPhotoNum ? "Complete" : `(${photos.length}) / ${requiredPhotoNum}`}
            handlePress={submit}
            containerStyles="w-full"
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UploadPhotos;
