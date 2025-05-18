import React from "react";
import { Text, TouchableOpacity } from "react-native";

const themeColours = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  error: 'bg-red'
}

const CustomButton = ({ title, handlePress, containerStyles, textStyles, isLoading, disabled, theme }) => {
  const bgColour = theme ? themeColours[theme] || themeColours['secondary'] : themeColours['secondary'];
  const isDisabled = isLoading || disabled;
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`${isDisabled ? 'bg-gray-400' : bgColour} rounded-xl min-h-[50px] px-6 items-center justify-center shadow-md ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isDisabled}
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
