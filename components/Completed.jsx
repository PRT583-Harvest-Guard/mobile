import React from 'react';
import CompletedAnim from "@/assets/animations/hg-completed.json";
import LottieView from 'lottie-react-native';

const Completed = () => {
  return (
    <LottieView
      source={CompletedAnim}
      autoPlay
      loop={true}
      style={{ width: '100%', height: '100%' }}
      resizeMode="contain"
    />
  );
}

export default Completed;