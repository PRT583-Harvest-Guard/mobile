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
      className={`${bgColour} rounded-xl min-h-[50px] px-6 items-center justify-center shadow-md ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isLoading}
    >
      <Text
        className={`text-white font-pbold text-xl ${textStyles}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default CustomButton;