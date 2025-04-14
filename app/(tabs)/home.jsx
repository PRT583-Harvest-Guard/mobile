import React from 'react'
import { View, Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import iconPrimary from '@/assets/images/icon-primary.png'
import { Avatar, CustomButton } from '@/components';
import { router } from 'expo-router';

const Home = () => {
  const user = {
    name: "John Doe",
    avatar: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg"
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <View className='w-full h-full flex-col items-center justify-around px-4'>
        {/* Header */}
        <View className='w-full flex-row items-center justify-between'>
          {/* User */}
          <View className='flex-row items-center gap-2'>
            {/* Avatar */}
            <View className='w-[50px] h-[50px] items-center justify-center rounded-full'>
              <Avatar user={user}/>
            </View>
            {/* User Name */}
            <View className='flex-col items-start gap-2'>
              <Text className='text-base font-pregular text-black'>
                Welcome
              </Text>
              <Text className='text-2xl font-pmedium text-black'>
                {user?.name}
              </Text>
            </View>
          </View>
          {/* Logo */}
          <Image
            source={iconPrimary}
            className='w-[130px] h-auto'
            resizeMode='cover'
          />
        </View>
        {/* Body */}
        <View className='w-full flex-col items-center gap-5'>
          <Text className='text-xl font-pregular text-black mb-10'>
            Boost your yield with Harvest Guard!
          </Text>
          <CustomButton
            title="Get an Inspection Suggestion"
            handlePress={() => { router.push("/inspection/submit-data") }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
          <CustomButton
            title="Synchronise Inspections"
            handlePress={() => { router.push("/sync/sync-records") }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
          <CustomButton
            title="Get Support"
            handlePress={() => { }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Home;
