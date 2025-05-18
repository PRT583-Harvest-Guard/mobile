import React from 'react';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, CustomButton } from '@/components';
import AuthScreen from '@/components/layouts/AuthScreen';
import AuthHeader from '@/components/ui/AuthHeader';
import { useChangePassword } from '@/hooks/useChangePassword';

const schema = z
  .object({
    current: z.string().min(6),
    next: z.string().min(6),
    confirm: z.string().min(6),
  })
  .refine(d => d.next === d.confirm, { path: ['confirm'], message: 'Mismatch' });

export default function ChangePassword() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { current: '', next: '', confirm: '' },
  });
  const { loading, changePassword } = useChangePassword();

  const onSubmit = ({ current, next }) =>
    changePassword(current, next).catch(e => Alert.alert('Error', e.message));

  return (
    <AuthScreen>
      <View className="flex-1 justify-center px-4">
        <AuthHeader />

        <Controller
          control={control}
          name="current"
          render={({ field }) => (
            <FormField
              title="Current Password"
              titleStyles="text-gray-100"
              value={field.value}
              handleTextChange={field.onChange}
              otherStyles="mt-2"
              secureTextEntry
            />
          )}
        />
        <Controller
          control={control}
          name="next"
          render={({ field }) => (
            <FormField
              title="New Password"
              titleStyles="text-gray-100"
              value={field.value}
              handleTextChange={field.onChange}
              otherStyles="mt-6"
              secureTextEntry
            />
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field }) => (
            <FormField
              title="Confirm Password"
              titleStyles="text-gray-100"
              value={field.value}
              handleTextChange={field.onChange}
              otherStyles="mt-6"
              secureTextEntry
            />
          )}
        />

        <CustomButton
          title="Save"
          handlePress={handleSubmit(onSubmit)}
          containerStyles="mt-10"
          isLoading={loading}
        />
      </View>
    </AuthScreen>
  );
}
