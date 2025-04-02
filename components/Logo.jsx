import React from "react";
import { Image, View } from "react-native";
import icon from "@/assets/images/icon.png";

const Logo = ({ containerStyles }) => {
  return (
    <View className={`items-center justify-center ${containerStyles}`}>
      <Image
      source={icon}
      className="w-[90%] h-[90%]"
      resizeMode="contain"
      />
    </View>
  );
}

export default Logo;