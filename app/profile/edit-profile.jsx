import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader, CustomButton, ProfilePhotoCapture } from '@/components';
import { getProfile, updateProfile } from '@/services/ProfileService';

const EditProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pictureUri, setPictureUri] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        Alert.alert('Error', 'User not found, please sign in again');
        router.replace('/');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        Alert.alert('Error', 'User ID not found, please sign in again');
        router.replace('/');
        return;
      }
      
      // Load profile data using the user ID
      const profileData = await getProfile(userId);
      
      if (profileData) {
        setProfile(profileData);
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setPhoneNumber(profileData.phone_number || '');
        setAddress(profileData.address || '');
        setPictureUri(profileData.picture_uri || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate inputs
      if (!firstName.trim()) {
        Alert.alert('Error', 'First name is required');
        return;
      }
      
      if (!lastName.trim()) {
        Alert.alert('Error', 'Last name is required');
        return;
      }
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        Alert.alert('Error', 'User not found, please sign in again');
        router.replace('/');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        Alert.alert('Error', 'User ID not found, please sign in again');
        router.replace('/');
        return;
      }
      
      // Update profile using the user ID
      const updatedProfile = await updateProfile(userId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        address: address.trim(),
        picture_uri: pictureUri
      });
      
      // Show success message
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <PageHeader title="Edit Profile" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E9762B" />
          <Text className="mt-4 text-base text-[#666]">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <PageHeader title="Edit Profile" />
      <ScrollView className="p-4">
        <ProfilePhotoCapture 
          photoUri={pictureUri} 
          onPhotoCapture={setPictureUri} 
        />
        
        <View className="mb-4">
          <Text className="text-base font-pbold text-[#555] mb-2">First Name *</Text>
          <TextInput
            className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-base"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-base font-pbold text-[#555] mb-2">Last Name *</Text>
          <TextInput
            className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-base"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-base font-pbold text-[#555] mb-2">Phone Number</Text>
          <TextInput
            className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-base"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-base font-pbold text-[#555] mb-2">Address</Text>
          <TextInput
            className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-base h-[100px] text-top"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View className="flex-row justify-between mt-6 mb-8">
          <CustomButton
            title="Cancel"
            handlePress={() => router.back()}
            containerStyles="flex-1 mr-2 bg-[#f0f0f0]"
            textStyles="text-[#666]"
          />
          
          <CustomButton
            title={saving ? 'Saving...' : 'Save'}
            handlePress={handleSave}
            containerStyles="flex-1 ml-2"
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


export default EditProfileScreen;
