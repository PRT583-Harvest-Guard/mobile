import React from 'react'
import { Stack } from 'expo-router'

const InspectionLayout = () => {
  return (
    <Stack>
      <Stack.Screen name='suggestion' options={{ headerShown: false }} />
      <Stack.Screen name='task' options={{ headerShown: false }} />
      <Stack.Screen name='completion' options={{ headerShown: false }} />
    </Stack>
  );
}

export default InspectionLayout;
