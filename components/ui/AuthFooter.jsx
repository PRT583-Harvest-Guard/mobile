import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function AuthFooter({ message, linkText, href }) {
  return (
    <View className="flex-row justify-center pt-4 gap-1">
      <Text className="text-lg text-gray-100">{message}</Text>
      <Link href={href} className="text-lg text-secondary">
        {linkText}
      </Link>
    </View>
  );
}