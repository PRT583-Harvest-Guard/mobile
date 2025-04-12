import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CustomButton, PageHeader, Completed } from '@/components'
import { router } from 'expo-router'

const Completion = () => {
  const confirm = () => {
    router.replace("/(tabs)/home");
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader
        title={"Inspection Records Syncs"}
        returnButton={false}
      />
      <View className='w-full min-h-[85vh] items-center justify-center px-4'>
        <Text className='text-4xl text-black font-pextrabold mt-8'>Well Done!</Text>
        <View className='h-[300px] w-[300px] items-center justify-center my-4'>
          <Completed />
        </View>
        <Text className='text-2xl text-black font-psemibold mb-16 text-center'>
          Your inspections records have been synced
        </Text>
        <CustomButton
          title="Confirm"
          containerStyles="w-full"
          theme="primary"
          handlePress={confirm}
        />
      </View>
    </SafeAreaView>
  )
}

export default Completion