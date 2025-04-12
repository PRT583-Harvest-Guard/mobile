import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

const PageHeader = ({ title, returnButton = true }) => {
  return (
    <View className='w-full relative flex-row items-center justify-center px-4 '>
      <Text className='w-full text-center text-xl text-black font-psemibold'>{title}</Text>

      {returnButton && (
        <TouchableOpacity
          className='absolute left-4 flex items-center justify-center'
          onPress={() => { router.back() }}
        >
          <AntDesign name="arrowleft" size={24} color="#E9762B" />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default PageHeader;