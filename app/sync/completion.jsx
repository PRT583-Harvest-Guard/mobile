import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CustomButton, PageHeader, Completed } from '@/components'
import { router, useLocalSearchParams } from 'expo-router'
import apiSyncService from '@/services/ApiSyncService'

const Completion = () => {
  const [syncStats, setSyncStats] = useState(null);
  const [syncTime, setSyncTime] = useState(new Date().toLocaleString());
  
  const confirm = () => {
    router.replace("/(tabs)/home");
  }

  useEffect(() => {
    const loadSyncData = async () => {
      try {
        // Try to get sync stats from the API service
        const stats = apiSyncService.getLastSyncStats();
        if (stats) {
          setSyncStats(stats);
          
          // If the stats have a timestamp, use it
          if (stats.timestamp) {
            setSyncTime(new Date(stats.timestamp).toLocaleString());
          } else {
            // Otherwise, try to get the last sync time from the service
            const lastSync = await apiSyncService.getLastSyncTime();
            if (lastSync) {
              setSyncTime(new Date(lastSync).toLocaleString());
            }
          }
        }
      } catch (error) {
        console.error('Error loading sync data:', error);
      }
    };
    
    loadSyncData();
  }, []);

  return (
    <SafeAreaView className='bg-white h-full'>
      <PageHeader
        title={"Inspection Records Syncs"}
        returnButton={false}
      />
      <ScrollView>
        <View className='w-full items-center justify-center px-4 py-6'>
          <Text className='text-4xl text-black font-pextrabold mt-8'>Well Done!</Text>
          <View className='h-[200px] w-[200px] items-center justify-center my-4'>
            <Completed />
          </View>
          <Text className='text-2xl text-black font-psemibold mb-4 text-center'>
            Your inspection records have been synced
          </Text>
          
          <Text className='text-sm text-gray-500 mb-6'>
            Sync completed at: {syncTime}
          </Text>
          
          {syncStats && (
            <View className='w-full max-w-md bg-gray-50 p-6 rounded-lg shadow-md mb-8'>
              <Text className='text-xl font-bold mb-4'>Sync Summary</Text>
              
              <View className='mb-2'>
                <Text className='font-bold'>Farms:</Text>
                <Text>{syncStats.farms} records synced</Text>
              </View>
              
              <View className='mb-2'>
                <Text className='font-bold'>Boundary Points:</Text>
                <Text>{syncStats.boundaryPoints} records synced</Text>
              </View>
              
              <View className='mb-2'>
                <Text className='font-bold'>Observation Points:</Text>
                <Text>{syncStats.observationPoints} records synced</Text>
              </View>
              
              <View className='mb-2'>
                <Text className='font-bold'>Inspection Suggestions:</Text>
                <Text>{syncStats.inspectionSuggestions} records synced</Text>
              </View>
              
              <View className='mb-2'>
                <Text className='font-bold'>Inspection Observations:</Text>
                <Text>{syncStats.inspectionObservations} records synced</Text>
              </View>
              
              <View className='mt-4 pt-4 border-t border-gray-200'>
                <Text className='font-bold'>Total Records:</Text>
                <Text>{
                  (syncStats.farms || 0) +
                  (syncStats.boundaryPoints || 0) +
                  (syncStats.observationPoints || 0) +
                  (syncStats.inspectionSuggestions || 0) +
                  (syncStats.inspectionObservations || 0)
                } records synced</Text>
              </View>
            </View>
          )}
          
          <CustomButton
            title="Return to Home"
            containerStyles="w-full max-w-md"
            theme="primary"
            handlePress={confirm}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Completion
