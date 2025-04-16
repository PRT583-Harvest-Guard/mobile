import React, { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo, FormField, CustomButton } from "@/components";
import { Link, router } from "expo-router";

const SignUp = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    // if (form.firstName === "" || form.lastName === "" || form.email === "" || form.mobile === "" || form.password === "") {
    //   Alert.alert("Error", "Please fill in all the fields!");
    //   return;
    // }
    setIsSubmitting(true);
    try {
      router.push("/(auth)/upload-photos");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full min-h-[85vh] justify-center px-4">
            <View className="w-full items-center justify-center">
              <Logo containerStyles="w-48 h-48" />
            </View>

            <FormField
              title="First Name"
              titleStyles="text-gray-100"
              value={form.firstName}
              handleTextChange={(e) => setForm({ ...form, firstName: e })}
              autoComplete="given-name"
            />

            <FormField
              title="Last Name"
              titleStyles="text-gray-100"
              value={form.lastName}
              handleTextChange={(e) => setForm({ ...form, lastName: e })}
              otherStyles="mt-5"
              autoComplete="family-name"
            />

            <FormField
              title="Email"
              titleStyles="text-gray-100"
              value={form.email}
              handleTextChange={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-5"
              keyboardType="email-address"
              autoComplete="email"
            />

            <FormField
              title="Mobile Number"
              titleStyles="text-gray-100"
              value={form.mobile}
              handleTextChange={(e) => setForm({ ...form, mobile: e })}
              otherStyles="mt-5"
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <FormField
              title="Password"
              titleStyles="text-gray-100"
              value={form.password}
              handleTextChange={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-5"
              autoComplete="new-password"
            />

            <CustomButton
              title="Submit"
              handlePress={submit}
              containerStyles="mt-10"
              isLoading={isSubmitting}
            />

            <View className="flex-row items-center justify-center pt-2 gap-2">
              <Text className="text-lg text-gray-100 font-pregular">
                Already have an account?
              </Text>
              <Link href="/(auth)/sign-in" className="text-lg text-secondary font-pregular">
                Log In
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUp;