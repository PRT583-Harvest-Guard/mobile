import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Avatar, CustomButton } from '@/components';
import { router } from 'expo-router';
import { getProfile } from '@/services/ProfileService';
import { getFarms } from '@/services/BoundaryService';
import iconPrimary from '@/assets/images/icon-primary.png';

const Home = () => {
  const [profile, setProfile] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mock upcoming inspections
  const upcomingInspections = [
    { id: '2455', dueIn: 3, farm: 'North Field' },
    { id: '2456', dueIn: 7, farm: 'South Field' },
    { id: '2457', dueIn: 14, farm: 'East Field' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load profile data
      const profileData = await getProfile();
      setProfile(profileData);
      
      // Load farms data
      const farmsData = await getFarms();
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading data:', error);
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.userSection}>
            {/* Avatar */}
            <TouchableOpacity 
              style={styles.avatarContainer}
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
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>
                Welcome,
              </Text>
              <Text style={styles.userName}>
                {loading ? 'Loading...' : getUserName()}
              </Text>
              
              {primaryFarm ? (
                <TouchableOpacity 
                  style={styles.farmInfo}
                  onPress={() => router.push(`/farm-details/${primaryFarm.id}`)}
                  activeOpacity={0.7}
                >
                  <Feather name="map-pin" size={12} color="#0066cc" style={styles.farmIcon} />
                  <Text style={styles.farmInfoText}>
                    Crop: {primaryFarm.plant_type || 'Not specified'} | Size: {primaryFarm.size || '0'} ha
                  </Text>
                  <Feather name="chevron-right" size={12} color="#0066cc" style={styles.farmArrow} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.farmInfo, styles.addFarmButton]}
                  onPress={() => router.push('/(tabs)/farm')}
                  activeOpacity={0.7}
                >
                  <Feather name="plus-circle" size={12} color="#E9762B" style={styles.farmIcon} />
                  <Text style={[styles.farmInfoText, styles.addFarmText]}>
                    Add Farm
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroText}>
            Boost your yield with Harvest Guard!
          </Text>
          <Image
            source={iconPrimary}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Upcoming Inspections */}
        <View style={styles.inspectionsCard}>
          <View style={styles.cardHeader}>
            <Feather name="calendar" size={20} color="#E9762B" />
            <Text style={styles.cardTitle}>Upcoming Inspections</Text>
          </View>
          
          {upcomingInspections.map(inspection => (
            <View key={inspection.id} style={styles.inspectionItem}>
              <View style={styles.inspectionDot} />
              <Text style={styles.inspectionText}>
                Inspection #{inspection.id} – due in {inspection.dueIn} day{inspection.dueIn !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/inspection/submit-data")}
          >
            <Feather name="search" size={24} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionText}>Suggest Next Inspection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push("/sync/sync-records")}
          >
            <Feather name="refresh-cw" size={24} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionText}>Sync Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryButton]}
            onPress={() => {}}
          >
            <Feather name="help-circle" size={24} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  farmInfo: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f0ff',
  },
  farmInfoText: {
    fontSize: 12,
    color: '#0066cc',
    fontFamily: 'Poppins-Medium',
  },
  farmIcon: {
    marginRight: 4,
  },
  farmArrow: {
    marginLeft: 4,
  },
  addFarmButton: {
    backgroundColor: '#fff8f0',
    borderColor: '#ffe0c0',
  },
  addFarmText: {
    color: '#E9762B',
  },
  heroSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
    flex: 1,
    marginRight: 16,
  },
  heroImage: {
    width: 80,
    height: 80,
  },
  inspectionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
    marginLeft: 8,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inspectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E9762B',
    marginRight: 12,
  },
  inspectionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9762B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: '#1B4D3E',
  },
  tertiaryButton: {
    backgroundColor: '#4A6FA5',
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
});

export default Home;
