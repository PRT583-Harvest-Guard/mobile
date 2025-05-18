import { useState } from 'react';
import AuthService from '@/services/AuthService';
import { useRouter } from 'expo-router';

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signUp = async (username: string, email: string, mobile: string, password: string) => {
    setLoading(true);
    try {
      const userData = {
        username,
        email,
        mobile,
        password
      };

      await AuthService.signUp(userData);
      // Alert.alert("Success", "Account created successfully! Please sign in.");
      router.replace("/(auth)/sign-in");
    } catch (error) {
      // Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
    try {
      // TODO: replace with real API request
      await new Promise(res => setTimeout(res, 800));
      // navigate to home after successful signup
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  return { loading, signUp };
}
