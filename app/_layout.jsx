import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { View, Text } from "react-native";
import "../global.css"
import GlobalProvider from "../context/GlobalProvider";
import "../utils/bcryptSetup"; // Import bcrypt setup to fix Math.random warning
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

// Define custom toast configuration
const toastConfig = {
  success: (props) => {
    const { heightScale = 1 } = props.props || {};
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#1B4D3E',
          backgroundColor: '#FFFFFF',
          height: 60 * heightScale,
          maxHeight: 120,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Poppins-SemiBold',
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
        }}
      />
    );
  },
  error: (props) => {
    const { heightScale = 1 } = props.props || {};
    return (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: '#E9762B',
          backgroundColor: '#FFFFFF',
          height: 60 * heightScale,
          maxHeight: 120,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Poppins-SemiBold',
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
        }}
      />
    );
  },
  info: (props) => {
    const { heightScale = 1 } = props.props || {};
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#007BFF',
          backgroundColor: '#FFFFFF',
          height: 60 * heightScale,
          maxHeight: 120,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Poppins-SemiBold',
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
        }}
      />
    );
  },
  warning: (props) => {
    const { heightScale = 1 } = props.props || {};
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#FFC107',
          backgroundColor: '#FFFFFF',
          height: 60 * heightScale,
          maxHeight: 120,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Poppins-SemiBold',
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: 'Poppins-Regular',
        }}
      />
    );
  }
};

const RootLayout = () => {
  const [loaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf")
  });

  useEffect(() => {
    if (error) throw new Error(error.message);
    if (loaded) {
      // Initialize database services
      const initializeServices = async () => {
        try {
          // Initialize profile table
          const { initProfileTable } = require('../services/ProfileService');
          await initProfileTable();
          console.log('Profile table initialized');
        } catch (err) {
          console.error('Error initializing services:', err);
        }
        
        // Hide splash screen after initialization
        SplashScreen.hideAsync();
      };
      
      initializeServices();
    }
  }, [loaded, error])

  if (!loaded && error) return null;

  return (
    <GlobalProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="inspection" options={{ headerShown: false }} />
        <Stack.Screen name="sync" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="farm-details" options={{ headerShown: false }} />
        <Stack.Screen name="observation" options={{ headerShown: false }} />
        <Stack.Screen name="draw-map" options={{ headerShown: false }} />
      </Stack>
      <Toast config={toastConfig} />
    </GlobalProvider>
  );
};

export default RootLayout;
