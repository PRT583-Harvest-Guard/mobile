import React from 'react';
import { View } from 'react-native';
import { Logo } from '@/components';

export default function AuthHeader() {
  return (
    <View className="items-center mb-6">
      <Logo containerStyles="w-56 h-56" />
    </View>
  );
}
