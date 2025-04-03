import { CustomButton, Logo, PhotoCapture } from '@/components'
import React, { useState } from 'react'
import { Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const UploadPhotos = () => {
  const requiredPhotoNum = 20;
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (photos.length < requiredPhotoNum) {
      Alert.alert("Error", `Please Upload at least ${requiredPhotoNum} photos at the border of your property!`);
      return;
    }

    setIsSubmitting(true);
    try {
      Alert.alert("Success", "Photos uploaded successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-primary h-full'>
      <View className='w-full h-full flex-col items-center justify-center gap-10 px-4'>
        {/* Logo */}
        <View className="w-full items-center justify-center">
          <Logo containerStyles="w-48 h-48" />
        </View>
        {/* Photo Uploading Component */}
        <View className='w-full flex-1'>
          <PhotoCapture
           title={`Please Upload at least ${requiredPhotoNum} photos at the border of your property `}
           photos={photos} 
           setPhotos={setPhotos} />
        </View>
        {/* Complete Button */}
        <CustomButton
          title="Complete"
          handlePress={submit}
          containerStyles="w-full mt-7"
          isLoading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  )
}

export default UploadPhotos;
