import { CustomButton, FormField, PageHeader } from '@/components'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Image, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker';

const EditProfile = () => {
  const user = {
    name: "John Doe",
    avatar: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg"
  }
  const [form, setForm] = useState({
    name: user.name,
    avatar: user.avatar
  })
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeAvatar = async () => {
    if (!form.name || !form.avatar) {
      Alert.alert("Error", "All fields are required!");
      return;
    }
    setIsSubmitting(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5
      });
      if (!result.canceled) {
        setForm({ ...form, avatar: result.assets[0].uri })
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const submit = async () => {
    setIsSubmitting(true);
    try {
      router.replace("/(tabs)/settings")
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader title="Edit Profile" />
      <View className='w-full h-full items-center justify-center px-4'>
        <View className='w-full flex-1 items-center justify-center'>
          {/* Avatar */}
          <TouchableOpacity
            className='w-[250px] h-[250px] items-center justify-center rounded-full mb-15'
            onPress={changeAvatar}
            disabled={isSubmitting}
          >
            <Image
              source={{ uri: form.avatar }}
              className='w-full h-full rounded-full bg-gray-500'
              resizeMode='cover'
            />
          </TouchableOpacity>
          {/* Name */}
          <FormField
            title="User Name"
            titleStyles="text-black"
            value={form.name}
            handleTextChange={(e) => setForm({ ...form, name: e })}
          />
        </View>
        <CustomButton
          title="Submit"
          containerStyles="w-full mb-6"
          handlePress={submit}
          isLoading={isSubmitting || (form.name === user.name && form.avatar === user.avatar)}
        />
      </View>
    </SafeAreaView>
  )
}

export default EditProfile