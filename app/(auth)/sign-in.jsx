import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { Logo, FormField, CustomButton } from "@/components";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


const SignIn = () => {
  const [form, setForm] = useState({
    mobile: "",
    password: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (form.mobile === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all the fields!")
    }
    setIsSubmitting(true);
    try {
      Alert.alert("Success", "Sign in successfully")
    } catch (error) {
      Alert.alert("Error", error.message)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="w-full min-h-[85vh] justify-center px-4">
          <View className="w-full items-center justify-center">
            <Logo containerStyles="w-64 h-64" />
          </View>

          <FormField
            title="Mobile Number"
            value={form.mobile}
            handleTextChange={(e) => setForm({ ...form, mobile: e })}
            otherStyles="mt-7"
          />

          <FormField
            title="Password"
            value={form.password}
            handleTextChange={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />

          <CustomButton
            title="Log In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="flex-row items-center justify-center pt-5 gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Do not have an account?
            </Text>
            <Link href="/(auth)/sign-up" className="text-lg text-secondary font-pregular">
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SignIn;