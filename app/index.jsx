import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { LogBox, ScrollView, Text, View } from "react-native";
import { Logo, CustomButton } from '@/components';
import { useGlobalContext } from "@/context/GlobalProvider";

// LogBox.ignoreLogs(['Warning: ...']);
// LogBox.ignoreAllLogs();

function App() {
  const { isLoggedIn, isLoading } = useGlobalContext();
  
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      const timeout = setTimeout(() => {
        router.replace("/(tabs)/home")
      }, 1500)

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isLoggedIn])

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView 
      contentContainerStyle={{ height: "100%" }}
      showsVerticalScrollIndicator={false}
      >
        <View className="w-full min-h-[85vh] items-center justify-center px-6">
          <Logo containerStyles="w-96 h-96" />
          <CustomButton
            title="Continue With Mobile"
            containerStyles="w-full mt-7"
            handlePress={() => { router.push("/(auth)/sign-in") }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;