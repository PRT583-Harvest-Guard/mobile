import React from 'react'
import { ActivityIndicator, View } from 'react-native'

const LoadingIndicator = ({isLoading}) => {
  return (
    <>
    {isLoading && (
      <View className='absolute w-full h-full bg-black/50 justify-center items-center z-10'>
        <ActivityIndicator size="large" color="#fff"/>
      </View>
    )}
    </>
  )
}

export default LoadingIndicator
