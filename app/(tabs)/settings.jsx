import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isDestructive && styles.destructiveIconContainer]}>
        <Feather name={icon} size={20} color={isDestructive ? "#fff" : "#1B4D3E"} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Settings" textColor="white" showBackButton={false} />
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Settings</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Management</Text>
          
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          {renderSettingItem(
            "log-out", 
            "Log Out", 
            "Sign out of your account", 
            logOut,
            true
          )}
        </View>
        
        {/* App Info */}
        <View style={styles.footer}>
          <Image 
            source={require('@/assets/images/icon-primary.png')} 
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.versionText}>Harvest Guard v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Harvest Guard. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    backgroundColor: '#1B4D3E',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#1B4D3E',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  breadcrumbActiveText: {
    fontSize: 14,
    color: '#E9762B',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f0ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destructiveIconContainer: {
    backgroundColor: '#ff4444',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#ff4444',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
});

export default Settings;
