import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGlobalContext } from '@/context/GlobalProvider';
import { PageHeader } from '@/components';

const Settings = () => {
  const { setIsLoggedIn } = useGlobalContext();

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
          onPress: () => {
            setIsLoggedIn(false);
            router.replace("/");
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
            () => Alert.alert("Coming Soon", "This feature will be available in a future update.")
          )}
          
          {renderSettingItem(
            "help-circle", 
            "Help & Support", 
            "Get assistance with using the app", 
            () => Alert.alert("Support", "For assistance, please contact support@harvestguard.com")
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
    </SafeAreaView>
  );
};


export default Settings;
