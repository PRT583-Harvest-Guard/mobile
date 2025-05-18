import { useState } from 'react';
import { useRouter } from 'expo-router';

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const changePassword = async (current: string, next: string) => {
    if (!current || !next) {
      // Alert.alert("Error", "All fields are required!");
      return;
    }
    setLoading(true);
    try {
      // todo
      // replace with real API call
      await new Promise(res => setTimeout(res, 1800));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return { loading, changePassword };
}
