import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGlobalContext } from '@/context/GlobalProvider';
import { PageHeader } from '@/components';
import AuthService from '@/services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showErrorToast, showSuccessToast, showInfoToast } from '@/utils/toastUtils';

const Settings = () => {
  const { setIsLoggedIn } = useGlobalContext();
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const logOut = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          onPress: async () => {
            try {
              // Get the session token and refresh token from AsyncStorage
              const sessionToken = await AsyncStorage.getItem('sessionToken');
              const refreshToken = await AsyncStorage.getItem('refresh_token');
              
              if (sessionToken) {
                // Sign out using the AuthService
                await AuthService.signOut(sessionToken, refreshToken);
                
                // Clear the session token and user data from AsyncStorage
                await AsyncStorage.removeItem('sessionToken');
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('refresh_token');
                await AsyncStorage.removeItem('access_token');
              }
              
              // Update the global state and navigate to the home page
              setIsLoggedIn(false);
              router.replace("/");
            } catch (error) {
              console.error('Error signing out:', error);
              showErrorToast('Failed to sign out. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, subtitle, onPress, isDestructive = false) => (
    <TouchableOpacity 
      className="flex-row items-center bg-white rounded-xl p-4 mb-2 shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${isDestructive ? 'bg-red' : 'bg-[#e6f0ed]'}`}>
        <Feather name={icon} size={20} color={isDestructive ? "#fff" : "#1B4D3E"} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-pbold ${isDestructive ? 'text-red' : 'text-[#333]'} mb-0.5`}>{title}</Text>
        {subtitle && <Text className="text-xs text-[#666]">{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fa]">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader title="Settings" textColor="white" showBackButton={false} />
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Settings</Text>
      </View>
      
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-lg font-pbold text-[#333] mb-3 pl-2">Account</Text>
          
          {renderSettingItem(
            "user", 
            "Edit Profile", 
            "Update your personal information", 
            () => router.push("/profile/edit-profile")
          )}
          
          {renderSettingItem(
            "lock", 
            "Change Password", 
            "Update your security credentials", 
            () => router.push("/profile/change-password")
          )}
        </View>
        
        {/* Farm Management Section */}
        <View className="mb-6">
          <Text className="text-lg font-pbold text-[#333] mb-3 pl-2">Farm Management</Text>
          
          {renderSettingItem(
            "map", 
            "Edit Property Border", 
            "Update your farm boundaries", 
            () => router.push("/(tabs)/farm")
          )}
          
          {renderSettingItem(
            "database", 
            "Sync Data", 
            "Synchronize your local data with the server", 
            () => router.push("/sync/sync-records")
          )}
        </View>
        
        {/* App Settings Section */}
        <View className="mb-6">
          <Text className="text-lg font-pbold text-[#333] mb-3 pl-2">App Settings</Text>
          
          {renderSettingItem(
            "bell", 
            "Notifications", 
            "Manage your notification preferences", 
            () => setNotificationsModalVisible(true)
          )}
          
          {renderSettingItem(
            "help-circle", 
            "Help & Support", 
            "Get assistance with using the app", 
            () => setSupportModalVisible(true)
          )}
        </View>
        
        {/* Account Actions Section */}
        <View className="mb-6">
          <Text className="text-lg font-pbold text-[#333] mb-3 pl-2">Account Actions</Text>
          
          {renderSettingItem(
            "log-out", 
            "Log Out", 
            "Sign out of your account", 
            logOut,
            true
          )}
        </View>
        
        {/* App Info */}
        <View className="items-center mt-4 mb-8 pt-4 border-t border-[#e0e0e0]">
          <Image 
            source={require('@/assets/images/icon-primary.png')} 
            className="w-[60px] h-[60px] mb-2"
            resizeMode="contain"
          />
          <Text className="text-sm text-[#666] mb-1">Harvest Guard v1.0.0</Text>
          <Text className="text-xs text-[#999]">© 2025 Harvest Guard. All rights reserved.</Text>
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
                source={require('@/assets/images/icon-primary.png')}
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
      
      {/* Notifications Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl w-full max-w-[400px] shadow-md overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-[#eee]">
              <Text className="text-xl font-pbold text-[#333]">Notifications</Text>
              <TouchableOpacity 
                onPress={() => setNotificationsModalVisible(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View className="p-5 items-center">
              <Image 
                source={require('@/assets/images/icon-primary.png')}
                className="w-20 h-20 mb-4"
                resizeMode="contain"
              />
              
              <Text className="text-base text-[#666] text-center mb-6 font-pregular">
                Notification preferences will be available in a future update. Stay tuned for enhanced notification features!
              </Text>
              
              <View className="bg-[#f9f9f9] rounded-xl p-4 mb-3 w-full">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-[#e6f0ed] justify-center items-center mr-3">
                    <Feather name="bell" size={20} color="#1B4D3E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-[#333] font-pmedium">Coming Soon</Text>
                  </View>
                </View>
                
                <Text className="text-sm text-[#666] font-pregular pl-[52px]">
                  • Push notifications for inspection reminders
                </Text>
                <Text className="text-sm text-[#666] font-pregular pl-[52px]">
                  • Alerts for pest and disease detection
                </Text>
                <Text className="text-sm text-[#666] font-pregular pl-[52px]">
                  • Weather alerts and forecasts
                </Text>
                <Text className="text-sm text-[#666] font-pregular pl-[52px]">
                  • Customizable notification preferences
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              className="bg-primary p-4 items-center"
              onPress={() => setNotificationsModalVisible(false)}
            >
              <Text className="text-white text-base font-pbold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


export default Settings;
