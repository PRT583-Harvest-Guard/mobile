import { PageHeader } from '@/components';
import React, { useState } from 'react'
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Go from '@/assets/animations/hg-go.json'
import Loading from '@/assets/animations/hg-loading.json';
import { router } from 'expo-router';

const SyncRecords = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    setIsSubmitting(true);
    try {
      router.push("/sync/completion")
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader
        title="Synchronise Inspection Records"
      />
      <View className="w-full flex-1 items-center justify-center px-4">
        <TouchableOpacity
          className='w-[300px] h-[300px] items-center justify-center mb-5'
          onPress={submit}
          disabled={isSubmitting}
        >
          <LottieView
            source={!isSubmitting ? Go : Loading}
            style={{ width: "100%", height: "100%" }}
            resizeMode='contain'
            autoPlay
            loop
          />
        </TouchableOpacity>
        <Text className="text-2xl text-black font-psemibold">
          {!isSubmitting ? "Start" : "Processing ..."}
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default SyncRecords;