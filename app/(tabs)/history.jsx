import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordCard, PageHeader, DropDownField } from '@/components';
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { 
  getInspectionObservations,
  getPendingInspectionObservations,
  getCompletedInspectionObservations,
  initInspectionObservationTable,
  getInspectionObservationsByFarmId,
  deleteInspectionObservation
} from '@/services/InspectionObservationService';
import {
  getInspectionSuggestions,
  getInspectionSuggestionById,
  getInspectionSuggestionsByFarmId,
  initInspectionSuggestionTable,
  deleteInspectionSuggestion
} from '@/services/InspectionSuggestionService';
import {
  getFarms,
  getBoundaryData
} from '@/services/BoundaryService';
import { getObservationPoints } from '@/services/ObservationService';
import databaseService from '@/services/DatabaseService';

function History() {
  const [unfinishedList, setUnfinishedList] = useState([]);
  const [finishedList, setFinishedList] = useState([]);
  const [isShowUnfinishedList, setIsShowUnfinishedList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmObservationPoints, setFarmObservationPoints] = useState([]);
  const [showFarmObservations, setShowFarmObservations] = useState(false);

  // Function to delete all suggestions and observations
  const deleteAllSuggestions = async () => {
    try {
      // Confirm deletion with the user
      Alert.alert(
        "Delete All Inspections",
        "Are you sure you want to delete all inspection suggestions and observations? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                setIsDeleting(true);
                
                console.log('Starting deletion of all inspection suggestions and observations...');
                
                // Initialize the database service
                await databaseService.initialize();
                
                // Get all inspection observations
                console.log('Getting all inspection observations...');
                const observations = await getInspectionObservations();
                console.log(`Found ${observations.length} inspection observations`);
                
                // Delete all inspection observations
                console.log('Deleting all inspection observations...');
                for (const observation of observations) {
                  try {
                    await deleteInspectionObservation(observation.id);
                    console.log(`Deleted observation with ID: ${observation.id}`);
                  } catch (error) {
                    console.error(`Error deleting observation with ID ${observation.id}:`, error);
                  }
                }
                
                // Get all inspection suggestions
                console.log('Getting all inspection suggestions...');
                const suggestions = await getInspectionSuggestions();
                console.log(`Found ${suggestions.length} inspection suggestions`);
                
                // Delete all inspection suggestions
                console.log('Deleting all inspection suggestions...');
                for (const suggestion of suggestions) {
                  try {
                    await deleteInspectionSuggestion(suggestion.id);
                    console.log(`Deleted suggestion with ID: ${suggestion.id}`);
                  } catch (error) {
                    console.error(`Error deleting suggestion with ID ${suggestion.id}:`, error);
                  }
                }
                
                // Try to clear the tables using SQL-like queries
                try {
                  await databaseService.executeQuery('DELETE FROM InspectionObservations');
                  await databaseService.executeQuery('DELETE FROM InspectionSuggestions');
                  console.log('Database tables cleared using SQL queries');
                } catch (error) {
                  console.error('Error clearing database tables:', error);
                }
                
                console.log('All inspection suggestions and observations have been deleted');
                
                // Reload the data
                await loadData();
                
                Alert.alert(
                  "Deletion Complete",
                  "All inspection suggestions and observations have been deleted."
                );
              } catch (error) {
                console.error('Error deleting suggestions and observations:', error);
                Alert.alert(
                  "Error",
                  "Failed to delete all suggestions and observations: " + error.message
                );
              } finally {
                setIsDeleting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in deleteAllSuggestions:', error);
      Alert.alert("Error", "An unexpected error occurred: " + error.message);
      setIsDeleting(false);
    }
  };

  // Move loadData outside of useEffect so we can call it from the refresh button
  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading inspection history data...');
      
      // Initialize the tables if needed
      await initInspectionObservationTable();
      await initInspectionSuggestionTable();
      
      // Get all farms
      const farmsData = await getFarms();
      console.log('Loaded farms:', farmsData.length);
      setFarms(farmsData);
      
      // Get the current user ID (using 1 as default for now)
      const userId = 1; // In a real app, this would come from authentication context
      console.log('Using user ID:', userId);
      
      // Load inspection observations for the current user
      const pendingObservations = await getPendingInspectionObservations(userId);
      const completedObservations = await getCompletedInspectionObservations(userId);
      
      console.log('Loaded pending observations:', pendingObservations.length);
      console.log('Loaded completed observations:', completedObservations.length);
      
      // Load inspection suggestions
      const suggestions = await getInspectionSuggestions();
      console.log('Loaded suggestions:', suggestions.length);
      
      // Create a map of suggestions by ID for quick lookup
      const suggestionsMap = {};
      suggestions.forEach(suggestion => {
        suggestionsMap[suggestion.id] = suggestion;
      });
      
      // Format the data for display by combining observation and suggestion data
      const formatObservation = async (observation) => {
        console.log('Formatting observation:', observation.id);
        
        // Get farm details
        const farm = farms.find(f => f.id === observation.farm_id);
        
        // Get suggestion details
        const suggestion = suggestionsMap[observation.inspection_id] || {};
        
        // Get boundary points (observation points) for the farm
        const boundaryPoints = await getBoundaryData(observation.farm_id);
        
        // Count the number of sections (boundary points)
        const sectionCount = boundaryPoints.length;
        
        return {
          id: observation.id,
          Date: new Date(observation.date).toLocaleDateString(),
          // From inspection suggestion
          Category: suggestion.target_entity || observation.target_entity || 'Unknown',
          ConfidenceLevel: suggestion.confidence_level || observation.confidence || 'Unknown',
          InspectionSections: sectionCount || 1,
          // From farm service
          InspectedPlantsPerSection: farm?.plant_per_section || observation.plant_per_section || 0,
          // From observation points
          Finished: observation.status === 'completed' ? 1 : 0,
          FarmId: observation.farm_id,
          Status: observation.status,
          // Additional details
          FarmName: farm?.name || 'Unknown Farm',
          FarmSize: farm?.size || 0,
          SuggestionId: observation.inspection_id
        };
      };
      
      // Process observations in parallel
      const pendingPromises = pendingObservations.map(formatObservation);
      const completedPromises = completedObservations.map(formatObservation);
      
      const formattedPending = await Promise.all(pendingPromises);
      const formattedCompleted = await Promise.all(completedPromises);
      
      console.log('Formatted pending observations:', formattedPending.length);
      console.log('Formatted completed observations:', formattedCompleted.length);
      
      setUnfinishedList(formattedPending);
      setFinishedList(formattedCompleted);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading inspection history:', error);
      Alert.alert('Error', 'Failed to load inspection history: ' + error.message);
      setLoading(false);
    }
  };
  
  // Call loadData when the component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Also load data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('History screen focused, reloading data...');
      loadData();
      return () => {
        // Cleanup function when screen goes out of focus
        console.log('History screen unfocused');
      };
    }, [])
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clipboard" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {isShowUnfinishedList 
          ? "No unfinished inspections found" 
          : "No completed inspections found"}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButtonEmpty}
        onPress={() => loadData()}
        disabled={isDeleting}
      >
        <Feather name="refresh-cw" size={20} color="#666" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Inspection History" textColor="white" showBackButton={false} />
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadData()}
            disabled={isDeleting}
          >
            <Feather name="refresh-cw" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
            onPress={deleteAllSuggestions}
            disabled={isDeleting}
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Inspection History</Text>
      </View>
      
      {/* Farm Dropdown */}
      {farms.length > 0 && (
        <View style={styles.farmDropdownContainer}>
          <DropDownField
            label="Select Farm"
            data={farms.map(farm => farm.name)}
            onSelect={async (selectedItem, index) => {
              const farm = farms[index];
              setSelectedFarm(farm);
              setLoading(true);
              
              try {
                // Get observation points for the selected farm
                const observationPoints = await getObservationPoints(farm.id);
                console.log(`Loaded ${observationPoints.length} observation points for farm ${farm.name}`);
                
                // Format observation points for display
                const formattedPoints = await Promise.all(observationPoints.map(async point => {
                  return {
                    id: point.id,
                    Date: new Date().toLocaleDateString(),
                    Category: point.target_entity || 'Unknown',
                    ConfidenceLevel: point.confidence_level || 'Unknown',
                    InspectionSections: 1,
                    InspectedPlantsPerSection: 0,
                    Finished: point.observation_status === 'completed' ? 1 : 0,
                    FarmId: farm.id,
                    Status: point.observation_status || 'Nil',
                    FarmName: farm.name,
                    FarmSize: farm.size,
                    SuggestionId: point.inspection_suggestion_id
                  };
                }));
                
                setFarmObservationPoints(formattedPoints);
                setShowFarmObservations(true);
              } catch (error) {
                console.error('Error loading farm observation points:', error);
                Alert.alert('Error', 'Failed to load farm observation points: ' + error.message);
              } finally {
                setLoading(false);
              }
            }}
            selectedVal={selectedFarm?.name}
          />
          
          {showFarmObservations && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShowFarmObservations(false);
                setSelectedFarm(null);
              }}
            >
              <Feather name="arrow-left" size={20} color="#1B4D3E" />
              <Text style={styles.backButtonText}>Back to Inspection History</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isShowUnfinishedList && styles.activeTabButton
            ]}
            onPress={() => setIsShowUnfinishedList(true)}
          >
            <Text style={[
              styles.tabText,
              isShowUnfinishedList && styles.activeTabText
            ]}>
              Unfinished ({unfinishedList.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              !isShowUnfinishedList && styles.activeTabButton
            ]}
            onPress={() => setIsShowUnfinishedList(false)}
          >
            <Text style={[
              styles.tabText,
              !isShowUnfinishedList && styles.activeTabText
            ]}>
              Completed ({finishedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading || isDeleting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E9762B" />
            <Text style={styles.loadingText}>
              {isDeleting ? 'Deleting all suggestions...' : 'Loading...'}
            </Text>
          </View>
        ) : showFarmObservations ? (
          /* Farm Observation Points List */
          <FlatList
            data={farmObservationPoints}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <RecordCard
                id={item.id}
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles={`mb-4 ${item.Finished ? 'bg-green-50' : 'bg-gray-50'}`}
                status={item.Status}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Feather name="map-pin" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  No observation points found for this farm
                </Text>
              </View>
            )}
            onRefresh={() => {
              if (selectedFarm) {
                getObservationPoints(selectedFarm.id).then(points => {
                  const formattedPoints = points.map(point => ({
                    id: point.id,
                    Date: new Date().toLocaleDateString(),
                    Category: point.target_entity || 'Unknown',
                    ConfidenceLevel: point.confidence_level || 'Unknown',
                    InspectionSections: 1,
                    InspectedPlantsPerSection: 0,
                    Finished: point.observation_status === 'completed' ? 1 : 0,
                    FarmId: selectedFarm.id,
                    Status: point.observation_status || 'Nil',
                    FarmName: selectedFarm.name,
                    FarmSize: selectedFarm.size,
                    SuggestionId: point.inspection_suggestion_id
                  }));
                  setFarmObservationPoints(formattedPoints);
                });
              }
            }}
            refreshing={loading}
          />
        ) : (
          /* Inspection History List */
          <FlatList
            data={isShowUnfinishedList ? unfinishedList : finishedList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <RecordCard
                id={item.id}
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles={`mb-4 ${item.Finished ? 'bg-green-50' : 'bg-gray-50'}`}
                status={item.Status}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
            onRefresh={loadData}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  farmDropdownContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#1B4D3E',
    fontSize: 16,
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  refreshButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#E9762B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default History;
