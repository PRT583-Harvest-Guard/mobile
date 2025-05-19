import React, { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Logo, FormField, CustomButton } from "@/components";
import { Link, router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import AuthService from "@/services/AuthService";
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils';

const SignUp = () => {
  const [form, setForm] = useState({
    mobile: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (form.mobile === "" || form.email === "" || form.password === "" || form.confirmPassword === "") {
      showErrorToast("Please fill in all the fields!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showErrorToast("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      showErrorToast("Password must be at least 6 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = {
        username: form.mobile,
        email: form.email,
        password: form.password
      };

      await AuthService.signUp(userData);
      showSuccessToast("Account created successfully! Please sign in.");
      router.replace("/(auth)/sign-in");
    } catch (error) {
      showErrorToast(error.message);
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
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full min-h-[85vh] justify-center px-4">
            <View className="w-full items-center justify-center">
              <Logo containerStyles="w-64 h-64" />
            </View>

            <FormField
              title="Mobile Number"
              titleStyles="text-gray-100"
              value={form.mobile}
              handleTextChange={(e) => setForm({ ...form, mobile: e })}
              otherStyles="mt-7"
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <FormField
              title="Email"
              titleStyles="text-gray-100"
              value={form.email}
              handleTextChange={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              keyboardType="email-address"
              autoComplete="email"
            />

            <FormField
              title="Password"
              titleStyles="text-gray-100"
              value={form.password}
              handleTextChange={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              autoComplete="new-password"
            />

            <FormField
              title="Confirm Password"
              titleStyles="text-gray-100"
              value={form.confirmPassword}
              handleTextChange={(e) => setForm({ ...form, confirmPassword: e })}
              otherStyles="mt-7"
              autoComplete="new-password"
            />

            <CustomButton
              title="Sign Up"
              handlePress={submit}
              containerStyles="mt-10"
              isLoading={isSubmitting}
            />

            <View className="flex-row items-center justify-center pt-2 gap-2">
              <Text className="text-lg text-gray-100 font-pregular">
                Already have an account?
              </Text>
              <Link href="/(auth)/sign-in" className='text-lg font-pregular text-secondary'>
                Sign In
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUp;
