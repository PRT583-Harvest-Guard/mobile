import React from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, CustomButton } from '@/components';
import AuthScreen from '@/components/layouts/AuthScreen';
import AuthHeader from '@/components/ui/AuthHeader';
import AuthFooter from '@/components/ui/AuthFooter';
import { useSignIn } from '@/hooks/useSignIn';

const schema = z.object({
  mobile: z.string().min(6, 'Enter mobile number'),
  password: z.string().min(6, 'Password ≥ 6 chars'),
});

export default function SignIn() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mobile: '', password: '' },
  });
  const { loading, signIn } = useSignIn();

  const onSubmit = ({ mobile, password }) =>
    signIn(mobile, password).catch(e => Alert.alert('Error', e.message));

  return (
    <AuthScreen>
      <View className="flex-1 justify-center px-4">
        <AuthHeader />

        <Controller
          control={control}
          name="mobile"
          render={({ field: { onChange, value } }) => (
            <FormField
              title="Mobile Number"
              titleStyles="text-gray-100"
              value={value}
              handleTextChange={onChange}
              otherStyles="mt-2"
              keyboardType="phone-pad"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormField
              title="Password"
              titleStyles="text-gray-100"
              value={value}
              handleTextChange={onChange}
              otherStyles="mt-6"
            />
          )}
        />

        <CustomButton
          title="Log In"
          handlePress={handleSubmit(onSubmit)}
          containerStyles="mt-10"
          isLoading={loading}
        />

        <AuthFooter message="No account?" linkText="Sign Up" href="/(auth)/sign-up" />
      </View>
    </AuthScreen>
  );
}
