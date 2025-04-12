import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CustomButton, PageHeader, PhotoCapture } from '@/components'
import { router } from 'expo-router'

const Task = () => {
  const requiredPhotoNum = 20;
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
      setIsSubmitting(true);
      try {
        router.replace("/(tabs)/history");
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
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader title="Inspection Task" />
      <View className='w-full h-full flex-col items-center justify-center gap-10 px-4'>
        <View className='w-full flex-1 mt-7'>
          <PhotoCapture
            title={`Please Upload at least ${requiredPhotoNum} photos at the border of your property `}
            titleStyles='text-black'
            photos={photos}
            setPhotos={setPhotos} />
        </View>
        <View className='w-full p-4'>
          {/* Save Button */}
          <CustomButton
            title="Save"
            handlePress={save}
            containerStyles="w-full mb-7"
            isLoading={isSubmitting}
            theme="primary"
          />
          {/* Complete Button */}
          <CustomButton
            title={photos.length === requiredPhotoNum ? "Complete" : `(${photos.length}) / ${requiredPhotoNum}`}
            handlePress={submit}
            containerStyles="w-full"
            isLoading={isSubmitting}
            theme="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Task