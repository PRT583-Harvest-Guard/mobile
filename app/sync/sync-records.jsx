import { PageHeader } from '@/components';
import React, { useState, useEffect } from 'react'
import { 
  Alert, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Go from '@/assets/animations/hg-go.json'
import Loading from '@/assets/animations/hg-loading.json';
import { router } from 'expo-router';
import apiSyncService from '@/services/ApiSyncService';
import AuthService from '@/services/AuthService';
import NetInfo from '@react-native-community/netinfo';

const SyncRecords = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncStats, setSyncStats] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Check network status and authentication status on component mount
  useEffect(() => {
    const checkNetworkAndAuth = async () => {
      try {
        // Check network status using NetInfo
        const networkState = await NetInfo.fetch();
        const isConnected = networkState.isConnected && networkState.isInternetReachable;
        setIsOnline(isConnected);
        apiSyncService.setOnlineStatus(isConnected);
        
        // Check if user is already authenticated with the API
        // Use skipTokenVerification=true to prevent continuous token refresh and verification
        const isAuth = await apiSyncService.isAuthenticated(true);
        setIsAuthenticated(isAuth);
        
        // Get last sync time
        const lastSync = await apiSyncService.getLastSyncTime();
        if (lastSync) {
          setLastSyncTime(new Date(lastSync).toLocaleString());
        }
      } catch (error) {
        console.error('Error checking network and authentication:', error);
      }
    };

    checkNetworkAndAuth();
    
    // Set up network status listener
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOnline(isConnected);
      apiSyncService.setOnlineStatus(isConnected);
    });
    
    return () => {
      // Clean up network status listener
      unsubscribe();
    };
  }, []);

  const authenticate = async () => {
    if (!username || !password) {
      setAuthError('Please enter your username and password');
      return;
    }
    
    // Clear previous errors
    setAuthError(null);
    setIsSubmitting(true);
    
    try {
      // Authenticate with the API
      const authResult = await apiSyncService.authenticate({ 
        username, 
        password 
      });
      
      if (authResult.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError('Authentication failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    try {
      await apiSyncService.signOut();
      setIsAuthenticated(false);
      setSyncStats(null);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Sign Out Error', error.message);
    }
  };

  const submit = async () => {
    // Clear previous errors
    setSyncError(null);
    setIsSubmitting(true);
    
    try {
      // Check if we're online
      if (!isOnline) {
        throw new Error('Cannot sync while offline. Please connect to the internet and try again.');
      }
      
      // Check if the API is reachable
      const isApiReachable = await apiSyncService.isApiReachable();
      if (!isApiReachable) {
        throw new Error('Cannot connect to the server. Please check your internet connection and try again.');
      }
      
      // Perform the sync
      const result = await apiSyncService.performFullSync();
      
      // Get the sync stats from the service
      const stats = apiSyncService.getLastSyncStats();
      setSyncStats(stats);
      
      // Update last sync time
      const lastSync = await apiSyncService.getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync).toLocaleString());
      }
      
      // Navigate to completion page
      router.push("/sync/completion");
    } catch (error) {
      console.error('Sync error:', error);
      
      // Handle network errors
      if (error.message.includes('Network request failed')) {
        setSyncError('Cannot connect to the server. Please check your internet connection and try again.');
      } else {
        setSyncError(error.message || 'Sync failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader
        title="Synchronise Inspection Records"
      />
      {/* Network Status Indicator */}
      <View className="w-full px-4 py-2 flex-row justify-between items-center bg-gray-100">
        <View className="flex-row items-center">
          <View className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-sm">{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        {lastSyncTime && (
          <Text className="text-xs text-gray-500">Last sync: {lastSyncTime}</Text>
        )}
      </View>
      
      <View className="w-full flex-1 items-center justify-center px-4">
        {!isAuthenticated ? (
          // Authentication UI
          <View className="w-full max-w-md bg-gray-50 p-6 rounded-lg shadow-md">
            <Text className="text-xl text-center font-bold mb-6">Login to Django API</Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-2">Phone Number</Text>
              <TextInput
                className="border border-gray-300 rounded-md px-4 py-2 bg-white"
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your phone number (e.g. +61405120723)"
                autoCapitalize="none"
                keyboardType="phone-pad"
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
            
            {authError && (
              <View className="mb-4 p-3 bg-red-100 rounded-md">
                <Text className="text-red-700">{authError}</Text>
              </View>
            )}
            
            <TouchableOpacity
              className="bg-green-600 py-3 rounded-md items-center"
              onPress={authenticate}
              disabled={isSubmitting || !isOnline}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold">
                  {isOnline ? 'Login' : 'Login (Offline Mode)'}
                </Text>
              )}
            </TouchableOpacity>
            
            {!isOnline && (
              <Text className="text-center text-sm text-gray-500 mt-4">
                You are currently offline. You can still login with your local credentials.
              </Text>
            )}
          </View>
        ) : (
          // Sync UI
          <>
            <View className="w-full flex-row justify-end mb-4">
              <TouchableOpacity
                className="bg-gray-200 px-4 py-2 rounded-md"
                onPress={signOut}
              >
                <Text className="text-gray-700">Sign Out</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              className='w-[300px] h-[300px] items-center justify-center mb-5'
              onPress={submit}
              disabled={isSubmitting || !isOnline}
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
            
            {syncError && (
              <View className="mb-4 p-3 bg-red-100 rounded-md w-full max-w-md">
                <Text className="text-red-700">{syncError}</Text>
              </View>
            )}
            
            {!isOnline && (
              <View className="mb-4 p-3 bg-yellow-100 rounded-md w-full max-w-md">
                <Text className="text-yellow-700">
                  You are currently offline. Sync will be available when you reconnect to the internet.
                </Text>
              </View>
            )}
            
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
