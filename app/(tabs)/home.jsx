import React from 'react'
import { View, Text, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import iconPrimary from '@/assets/images/icon-primary.png'
import { CustomButton } from '@/components';

const Home = () => {
  const user = {
    name: "John Doe",
    avatar: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg"
  }

  return (
    <SafeAreaView className='bg-white px-4 items-center justify-center'>
      <View className='w-full h-full flex-col items-center justify-around'>
        {/* Header */}
        <View className='w-full flex-row items-center justify-between'>
          {/* User */}
          <View className='flex-row items-center gap-2'>
            {/* Avatar */}
            <Image
              source={{ uri: user?.avatar }}
              className='w-[50px] h-[50px] rounded-full'
              resizeMode='contain'
            />
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
            handlePress={() => { }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
          <CustomButton
            title="Synchronise Inspections"
            handlePress={() => { }}
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
