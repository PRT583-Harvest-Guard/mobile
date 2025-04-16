import { CustomButton, Logo, PhotoCapture } from '@/components'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const UploadPhotos = () => {
  const requiredPhotoNum = 20;
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    setIsSubmitting(true);
    try {
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
      Alert.alert("Success", "Photos uploaded successfully!");
      router.replace("/(tabs)/home");
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
              setPhotos={setPhotos} />
          </View>
          <View className='w-full pb-4 px-4'>
            {/* Save Button */}
            <CustomButton
              title="Save"
              handlePress={save}
              containerStyles="w-full mb-7"
              isLoading={isSubmitting}
            />
            {/* Complete Button */}
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
