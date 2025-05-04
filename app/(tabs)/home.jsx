import React, { useState, useEffect } from 'react'
import { View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import iconPrimary from '@/assets/images/icon-primary.png'
import { Avatar, CustomButton } from '@/components';
import { router } from 'expo-router';
import { getProfile } from '@/services/ProfileService';

const Home = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format the user's full name
  const getUserName = () => {
    if (!profile) return 'User';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'User';
    }
  };

  return (
    <SafeAreaView className='bg-white h-full'>
      <View className='w-full h-full flex-col items-center justify-around px-4'>
        {/* Header */}
        <View className='w-full flex-row items-center justify-between'>
          {/* User */}
          <View className='flex-row items-center gap-2'>
            {/* Avatar */}
            <TouchableOpacity 
              className='w-[50px] h-[50px] items-center justify-center rounded-full'
              onPress={() => router.push('/profile/edit-profile')}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#E9762B" />
              ) : (
                <Avatar user={{ 
                  name: getUserName(),
                  avatar: profile?.picture_uri || null
                }}/>
              )}
            </TouchableOpacity>
            {/* User Name */}
            <View className='flex-col items-start gap-2'>
              <Text className='text-base font-pregular text-black'>
                Welcome
              </Text>
              <Text className='text-2xl font-pmedium text-black'>
                {loading ? 'Loading...' : getUserName()}
              </Text>
            </View>
          </View>
          {/* Logo */}
          <Image
            source={iconPrimary}
            className='w-[130px] h-auto'
            resizeMode='cover'
          />
        </View>
        {/* Body */}
        <View className='w-full flex-col items-center gap-5'>
          <Text className='text-xl font-pregular text-black mb-10'>
            Boost your yield with Harvest Guard!
          </Text>
          <CustomButton
            title="Get an Inspection Suggestion"
            handlePress={() => { router.push("/inspection/submit-data") }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
          <CustomButton
            title="Synchronise Inspections"
            handlePress={() => { router.push("/sync/sync-records") }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
          <CustomButton
            title="Get Support"
            handlePress={() => { }}
            containerStyles="w-full h-[130px]"
            theme="primary"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Home;
