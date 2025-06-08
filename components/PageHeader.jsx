import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

const PageHeader = ({ 
  title, 
  returnButton = true, 
  textColor = "black", 
  showBackButton = true,
  handleBackPress = null 
}) => {
  const handleBack = () => {
    if (handleBackPress) {
      handleBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View className='w-full relative flex-row items-center justify-center px-4 '>
      <Text className={`w-full text-center text-xl text-${textColor} font-psemibold`}>{title}</Text>

      {returnButton && showBackButton && (
        <TouchableOpacity
          className='absolute left-4 flex items-center justify-center'
          onPress={handleBack}
        >
          <AntDesign name="arrowleft" size={24} color={textColor === "white" ? "white" : "#E9762B"} />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default PageHeader;
