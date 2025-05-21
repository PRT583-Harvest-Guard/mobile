import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Avatar, CustomButton } from '@/components';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '@/services/ProfileService';
import { getFarms } from '@/services/BoundaryService';
import { getPendingInspectionObservations } from '@/services/InspectionObservationService';
import { getInspectionSuggestionById } from '@/services/InspectionSuggestionService';
import iconPrimary from '@/assets/images/icon-primary.png';

const Home = () => {
  const [profile, setProfile] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [upcomingInspections, setUpcomingInspections] = useState([]);

  // Load data when the component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Also load data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Home screen focused, reloading data...');
      loadData();
      return () => {
        // Cleanup function when screen goes out of focus
        console.log('Home screen unfocused');
      };
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      // Load profile data
      const profileData = await getProfile();
      setProfile(profileData);
      
      // Get the current user ID from AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        console.warn('User not found, please sign in again');
        setFarms([]);
        setUpcomingInspections([]);
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      if (!userId) {
        console.warn('User ID not found, please sign in again');
        setFarms([]);
        setUpcomingInspections([]);
        return;
      }
      
      // Load farms data for the current user
      const farmsData = await getFarms(userId);
      setFarms(farmsData);
      
      // Create a map of farms by ID for quick lookup
      const farmsMap = {};
      farmsData.forEach(farm => {
        farmsMap[farm.id] = farm;
      });
      
      // Load pending inspection observations for the current user
      console.log(`Loading pending observations for user ID: ${userId}`);
      const pendingObservations = await getPendingInspectionObservations(userId);
      console.log(`Loaded ${pendingObservations.length} pending observations for user ID: ${userId}`);
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
      
      // Process observations to get upcoming inspections
      const upcoming = [];
      
      for (const observation of pendingObservations) {
        try {
          // Parse the observation date
          const observationDate = new Date(observation.date);
          
          // Skip if the date has already passed
          if (observationDate < today) {
            continue;
          }
          
          // Calculate days until the inspection
          const timeDiff = observationDate.getTime() - today.getTime();
          const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          // Get the farm name
          const farmName = farmsMap[observation.farm_id]?.name || 'Unknown Farm';
          
          // Add to upcoming inspections
          upcoming.push({
            id: observation.section_id ? observation.section_id.toString() : observation.id.toString(),
            dueIn: daysUntil,
            farm: farmName,
            date: observationDate,
            // Store both IDs for reference
            observationId: observation.id.toString(),
            observationPointId: observation.section_id ? observation.section_id.toString() : null
          });
        } catch (error) {
          console.error('Error processing observation:', error);
          // Continue with the next observation
        }
      }
      
      // Sort by due date (closest first)
      upcoming.sort((a, b) => a.dueIn - b.dueIn);
      
      // Update state
      setUpcomingInspections(upcoming);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setFarms([]);
      setUpcomingInspections([]);
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

  // Get the primary farm info
  const getPrimaryFarm = () => {
    if (farms.length === 0) return null;
    return farms[0]; // Just use the first farm for now
  };

  const primaryFarm = getPrimaryFarm();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fa]">
      <ScrollView className="p-4">
        {/* Header Card */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center">
            {/* Avatar */}
            <TouchableOpacity 
              className="w-[60px] h-[60px] rounded-full overflow-hidden mr-4"
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
            
            {/* User Info */}
            <View className="flex-1">
              <Text className="text-sm text-[#666] font-pregular">
                Welcome,
              </Text>
              <Text className="text-[22px] font-pbold text-[#333] mb-1">
                {loading ? 'Loading...' : getUserName()}
              </Text>
              
              {primaryFarm ? (
                <TouchableOpacity 
                  className="bg-[#f0f8ff] py-[6px] px-[10px] rounded-md self-start flex-row items-center border border-[#e0f0ff]"
                  onPress={() => router.push(`/farm-details/${primaryFarm.id}`)}
                  activeOpacity={0.7}
                >
                  <Feather name="map-pin" size={12} color="#0066cc" className="mr-1" />
                  <Text className="text-xs text-[#0066cc] font-pmedium">
                    Crop: {primaryFarm.plant_type || 'Not specified'} | Size: {primaryFarm.size || '0'} ha
                  </Text>
                  <Feather name="chevron-right" size={12} color="#0066cc" className="ml-1" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  className="bg-[#fff8f0] py-[6px] px-[10px] rounded-md self-start flex-row items-center border border-[#ffe0c0]"
                  onPress={() => router.push('/(tabs)/farm')}
                  activeOpacity={0.7}
                >
                  <Feather name="plus-circle" size={12} color="#E9762B" className="mr-1" />
                  <Text className="text-xs text-[#E9762B] font-pmedium">
                    Add Farm
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        {/* Hero Section */}
        <View className="bg-white rounded-xl p-4 mb-4 flex-row items-center justify-between shadow-sm">
          <Text className="text-lg font-pbold text-[#333] flex-1 mr-4">
            Boost your yield with Harvest Guard!
          </Text>
          <Image
            source={iconPrimary}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>
        
        {/* Upcoming Inspections */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Feather name="calendar" size={20} color="#E9762B" />
            <Text className="text-lg font-pbold text-[#333] ml-2">Upcoming Inspections</Text>
          </View>
          
          {loading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#E9762B" />
              <Text className="text-sm text-[#666] mt-2">Loading inspections...</Text>
            </View>
          ) : upcomingInspections.length > 0 ? (
            <View className="max-h-[200px]">
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {upcomingInspections.map(inspection => (
                  <TouchableOpacity 
                    key={inspection.id} 
                    className="flex-row items-center py-2 border-b border-[#f0f0f0]"
                    onPress={() => router.push(`/observation/${inspection.id}`)}
                  >
                    <View className="w-2 h-2 rounded-full bg-secondary mr-3" />
                    <View className="flex-1">
                      <Text className="text-sm text-[#333] font-pregular">
                        Inspection #{inspection.id} – due in {inspection.dueIn} day{inspection.dueIn !== 1 ? 's' : ''}
                      </Text>
                      <Text className="text-xs text-[#666]">
                        Farm: {inspection.farm}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View className="h-6 bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0" />
            </View>
          ) : (
            <View className="py-4 items-center">
              <Feather name="calendar" size={24} color="#ccc" />
              <Text className="text-sm text-[#999] mt-2 text-center">
                No upcoming inspections scheduled.
              </Text>
              <TouchableOpacity 
                className="mt-3 bg-[#f0f0f0] py-2 px-4 rounded-lg"
                onPress={() => router.push("/inspection/suggestion")}
              >
                <Text className="text-sm text-[#666]">Create Inspection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View className="mb-4">
          <TouchableOpacity 
            className="flex-row items-center bg-secondary rounded-lg p-4 mb-3 shadow-sm"
            onPress={() => router.push("/inspection/suggestion")}
          >
            <Feather name="search" size={24} color="#fff" className="mr-3" />
            <Text className="text-base font-pbold text-white">Suggest Next Inspection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center bg-primary rounded-lg p-4 mb-3 shadow-sm"
            onPress={() => router.push("/sync/sync-records")}
          >
            <Feather name="refresh-cw" size={24} color="#fff" className="mr-3" />
            <Text className="text-base font-pbold text-white">Sync Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center bg-[#4A6FA5] rounded-lg p-4 mb-3 shadow-sm"
            onPress={() => setSupportModalVisible(true)}
          >
            <Feather name="help-circle" size={24} color="#fff" className="mr-3" />
            <Text className="text-base font-pbold text-white">Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Support Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={supportModalVisible}
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl w-full max-w-[400px] shadow-md overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-[#eee]">
              <Text className="text-xl font-pbold text-[#333]">Contact Support</Text>
              <TouchableOpacity 
                onPress={() => setSupportModalVisible(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View className="p-5 items-center">
              <Image 
                source={iconPrimary}
                className="w-20 h-20 mb-4"
                resizeMode="contain"
              />
              
              <Text className="text-base text-[#666] text-center mb-6 font-pregular">
                Need help with Harvest Guard? Our support team is ready to assist you.
              </Text>
              
              <TouchableOpacity 
                className="flex-row items-center bg-[#f9f9f9] rounded-xl p-4 mb-3 w-full"
                onPress={() => Linking.openURL('mailto:support@harvestguard.com')}
              >
                <View className="w-10 h-10 rounded-full bg-[#e6f0ed] justify-center items-center mr-3">
                  <Feather name="mail" size={20} color="#1B4D3E" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-[#666] font-pregular">Email</Text>
                  <Text className="text-base text-[#333] font-pmedium">support@harvestguard.com</Text>
                </View>
                <Feather name="external-link" size={16} color="#999" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center bg-[#f9f9f9] rounded-xl p-4 mb-3 w-full"
                onPress={() => Linking.openURL('tel:+61234567890')}
              >
                <View className="w-10 h-10 rounded-full bg-[#e6f0ed] justify-center items-center mr-3">
                  <Feather name="phone" size={20} color="#1B4D3E" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-[#666] font-pregular">Phone</Text>
                  <Text className="text-base text-[#333] font-pmedium">+61 2 3456 7890</Text>
                </View>
                <Feather name="external-link" size={16} color="#999" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center bg-[#f9f9f9] rounded-xl p-4 mb-3 w-full"
                onPress={() => Linking.openURL('https://harvestguard.com/support')}
              >
                <View className="w-10 h-10 rounded-full bg-[#e6f0ed] justify-center items-center mr-3">
                  <Feather name="globe" size={20} color="#1B4D3E" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-[#666] font-pregular">Support Center</Text>
                  <Text className="text-base text-[#333] font-pmedium">harvestguard.com/support</Text>
                </View>
                <Feather name="external-link" size={16} color="#999" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              className="bg-primary p-4 items-center"
              onPress={() => setSupportModalVisible(false)}
            >
              <Text className="text-white text-base font-pbold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


export default Home;
