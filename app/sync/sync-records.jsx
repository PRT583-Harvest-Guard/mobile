import { PageHeader } from '@/components';
import React, { useState, useEffect } from 'react'
import { Alert, View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Go from '@/assets/animations/hg-go.json'
import Loading from '@/assets/animations/hg-loading.json';
import { router } from 'expo-router';
import apiSyncService from '@/services/ApiSyncService';
import AuthService from '@/services/AuthService';

const SyncRecords = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncStats, setSyncStats] = useState(null);

  // Check if user is already authenticated with the API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const credentials = await apiSyncService.getStoredCredentials();
        if (credentials) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuth();
  }, []);

  const authenticate = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter your username and password');
      return;
    }

    setIsSubmitting(true);
    try {
      // First authenticate with local auth service
      const localAuth = await AuthService.signIn({ username, password });
      
      // Then authenticate with the API
      await apiSyncService.authenticate({ username, password });
      
      setIsAuthenticated(true);
    } catch (error) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      // Perform the sync
      const result = await apiSyncService.performFullSync();
      
      // Set sync stats for display
      setSyncStats({
        farms: result.farms?.length || 0,
        boundaryPoints: result.boundaryPoints?.length || 0,
        observationPoints: result.observationPoints?.length || 0,
        inspectionSuggestions: result.inspectionSuggestions?.length || 0,
        inspectionObservations: result.inspectionObservations?.length || 0,
      });
      
      // Navigate to completion page
      router.push("/sync/completion");
    } catch (error) {
      Alert.alert("Sync Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader
        title="Synchronise Inspection Records"
      />
      <View className="w-full flex-1 items-center justify-center px-4">
        {!isAuthenticated ? (
          // Authentication UI
          <View className="w-full max-w-md bg-gray-50 p-6 rounded-lg shadow-md">
            <Text className="text-xl text-center font-bold mb-6">Login to Django API</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-2">Username</Text>
              <TextInput
                className="border border-gray-300 rounded-md px-4 py-2 bg-white"
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-gray-700 mb-2">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-md px-4 py-2 bg-white"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              className="bg-green-600 py-3 rounded-md items-center"
              onPress={authenticate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">Login</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Sync UI
          <>
            <TouchableOpacity
              className='w-[300px] h-[300px] items-center justify-center mb-5'
              onPress={submit}
              disabled={isSubmitting}
            >
              <LottieView
                source={!isSubmitting ? Go : Loading}
                style={{ width: "100%", height: "100%" }}
                resizeMode='contain'
                autoPlay
                loop
              />
            </TouchableOpacity>
            <Text className="text-2xl text-black font-psemibold mb-4">
              {!isSubmitting ? "Start Sync" : "Syncing Data..."}
            </Text>
            
            {syncStats && (
              <View className="bg-gray-50 p-4 rounded-lg w-full max-w-md">
                <Text className="text-lg font-bold mb-2">Sync Statistics:</Text>
                <Text>Farms: {syncStats.farms}</Text>
                <Text>Boundary Points: {syncStats.boundaryPoints}</Text>
                <Text>Observation Points: {syncStats.observationPoints}</Text>
                <Text>Inspection Suggestions: {syncStats.inspectionSuggestions}</Text>
                <Text>Inspection Observations: {syncStats.inspectionObservations}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

export default SyncRecords;
