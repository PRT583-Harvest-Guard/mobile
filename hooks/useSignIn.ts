import { useState } from 'react';
import AuthService from '@/services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);

  const signIn = async (mobile: string, password: string) => {
    try {
      // todo sign in
      
      // setLoading(true);
      // const { user, sessionToken } = await AuthService.signIn({
      //   username: mobile,
      //   password,
      // });
      // await AsyncStorage.multiSet([
      //   ['sessionToken', sessionToken],
      //   ['user', JSON.stringify(user)],
      // ]);
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  return { loading, signIn };
};
