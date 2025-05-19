import { PageHeader, Logo } from '@/components'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CustomButton, FormField } from '@/components'
import { Alert, View } from 'react-native'
import { router } from 'expo-router'

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: null,
    newPassword: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!form.oldPassword || !form.newPassword) {
      Alert.alert("Error", "All fields are required!");
      return;
    }
    setIsSubmitting(true);
    try {
      router.replace("/(tabs)/settings");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-green h-full'>
      <PageHeader title="Change Password" />
      <View className='w-full h-full items-center justify-center px-4'>
        <View className='w-full flex-1 items-center justify-center'>
          {/* Logo */}
          <Logo containerStyles="w-64 h-64 mb-8" />
          
          {/* Old Password */}
          <FormField
            title="Old Password"
            titleStyles="text-black"
            value={form.name}
            handleTextChange={(e) => setForm({ ...form, oldPassword: e })}
            otherStyles="mb-10"
            autoComplete="current-password"
          />
          {/* New Password */}
          <FormField
            title="New Password"
            titleStyles="text-black"
            value={form.name}
            handleTextChange={(e) => setForm({ ...form, newPassword: e })}
            autoComplete="new-password"
          />
        </View>
        <CustomButton
          title="Submit"
          containerStyles="w-full mb-6"
          handlePress={submit}
          isLoading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

export default ChangePassword;
