import { Stack } from 'expo-router'
import React from 'react'

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='edit-profile' options={{headerShown: false}}/>
      <Stack.Screen name='change-password' options={{headerShown: false}}/>
    </Stack>
  )
}

export default ProfileLayout