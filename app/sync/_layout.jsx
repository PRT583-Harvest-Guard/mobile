import React from 'react'
import { Stack } from 'expo-router'

const SyncLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='sync-records' options={{headerShown: false}} />
      <Stack.Screen name='completion' options={{headerShown: false}} />
    </Stack>
  )
}

export default SyncLayout