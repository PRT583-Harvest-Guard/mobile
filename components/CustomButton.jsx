import React from "react";
import { Text, TouchableOpacity } from "react-native";

const CustomButton = ({ title, handlePress, containerStyles, textStyles, isLoading }) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-secondary rounded-xl min-h-[60px] items-center justify-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isLoading}
    >
      <Text
        className={`text-white font-pbold text-2xl ${textStyles}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default CustomButton;
