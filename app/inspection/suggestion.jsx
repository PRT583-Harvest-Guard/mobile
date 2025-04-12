import { PageHeader, CustomButton } from '@/components'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Suggestion = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = async () => {
    setIsSubmitting(true);
    try {
      router.push("/inspection/task");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader title="Inspection Suggestion" />
      <View className='w-full h-full items-center justify-center px-4'>
        <View className='w-full items-center justify-center p-8 bg-secondary rounded-2xl'>
          <Text className='text-4xl text-white font-psemibold' style={{letterSpacing: 1, lineHeight: 64}}>
            To reach the goal standard, you are advised to inspect X plants each in Y sections in a Z basis
          </Text>
        </View>
      </View>
      <CustomButton
        title="Start"
        handlePress={submit}
        containerStyles="absolute bottom-6 left-0 right-0 m-4"
        theme="primary"
      />
    </SafeAreaView>
  );
}

export default Suggestion