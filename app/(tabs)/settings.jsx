import { CustomButton } from '@/components';
import { router } from 'expo-router';
import React from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Settings = () => {
  return (
    <SafeAreaView className='w-full h-full'>
      <View className='w-full h-full px-4 flex-col items-center'>
        <Text className='w-full text-2xl text-black font-pregular text-center mb-10'>Settings</Text>
        <View className='w-full flex-1 flex-col items-center justify-center gap-8'>
          <CustomButton
            title="Edit Property Border"
            theme="primary"
            containerStyles="w-full"
            handlePress={() => { router.push("/(auth)/upload-photos") }}
          />
          <CustomButton
            title="Edit Profile"
            theme="primary"
            containerStyles="w-full"
            handlePress={() => { }}
          />
          <CustomButton
            title="Change Password"
            theme="primary"
            containerStyles="w-full"
            handlePress={() => { }}
          />
          <CustomButton
            title="Log Out"
            theme="error"
            containerStyles="w-full"
            handlePress={() => { }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Settings;
