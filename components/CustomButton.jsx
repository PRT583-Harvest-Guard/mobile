import React from "react";
import { Text, TouchableOpacity } from "react-native";

const themeColours = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  error: 'bg-red'
}

const CustomButton = ({ title, handlePress, containerStyles, textStyles, isLoading, theme }) => {
  const bgColour = theme ? themeColours[theme] || themeColours['secondary'] : themeColours['secondary'];
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`${bgColour} rounded-xl min-h-[60px] items-center justify-center shadow-md ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
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
