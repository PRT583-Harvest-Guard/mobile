import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
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
  const [pendingFarmPoints, setPendingFarmPoints] = useState([]);
  const [completedFarmPoints, setCompletedFarmPoints] = useState([]);
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
          Finished: observation.status === 'completed' || observation.status === 'Completed' ? 1 : 0,
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
      
      let formattedPending = await Promise.all(pendingPromises);
      let formattedCompleted = await Promise.all(completedPromises);
      
      // Make sure all observations with "Completed" status are in the completed list
      // and all other observations are in the pending list
      const allObservations = [...formattedPending, ...formattedCompleted];
      
      // Filter observations based on status
      formattedCompleted = allObservations.filter(obs => 
        obs.Status === 'Completed' || obs.Status === 'completed'
      );
      
      formattedPending = allObservations.filter(obs => 
        obs.Status !== 'Completed' && obs.Status !== 'completed'
      );
      
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
      
      // Reset all state to ensure fresh data
      setUnfinishedList([]);
      setFinishedList([]);
      setFarms([]);
      setSelectedFarm(null);
      setFarmObservationPoints([]);
      setShowFarmObservations(false);
      setLoading(true);
      
      // Load all data from scratch
      loadData();
      
      return () => {
        // Cleanup function when screen goes out of focus
        console.log('History screen unfocused');
      };
    }, [])
  );

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <Feather name="clipboard" size={48} color="#ccc" />
      <Text className="mt-4 text-base text-[#999] text-center">
        {isShowUnfinishedList 
          ? "No unfinished inspections found" 
          : "No completed inspections found"}
      </Text>
      <TouchableOpacity 
        className="flex-row items-center bg-[#f0f0f0] p-3 rounded-lg mt-4"
        onPress={() => loadData()}
        disabled={isDeleting}
      >
        <Feather name="refresh-cw" size={20} color="#666" />
        <Text className="ml-2 text-[#666] text-base">Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fa]">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm flex-row justify-between items-center">
        <PageHeader title="Inspection History" textColor="white" showBackButton={false} />
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="p-2 mr-2"
            onPress={() => loadData()}
            disabled={isDeleting}
          >
            <Feather name="refresh-cw" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className={`p-2 mr-2 bg-red/20 rounded-lg ${isDeleting ? 'opacity-50' : ''}`}
            onPress={deleteAllSuggestions}
            disabled={isDeleting}
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Inspection History</Text>
      </View>
      
      {/* Farm Dropdown */}
      {farms.length > 0 && (
        <View className="p-4 bg-white border-b border-[#e0e0e0]">
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
                    Finished: point.observation_status === 'completed' || point.observation_status === 'Completed' ? 1 : 0,
                    FarmId: farm.id,
                    Status: point.observation_status || 'Nil',
                    FarmName: farm.name,
                    FarmSize: farm.size,
                    SuggestionId: point.inspection_suggestion_id
                  };
                }));
                
                // Filter observation points based on status
                const completedPoints = formattedPoints.filter(point => 
                  point.Status === 'Completed' || point.Status === 'completed'
                );
                
                const pendingPoints = formattedPoints.filter(point => 
                  point.Status !== 'Completed' && point.Status !== 'completed'
                );
                
                // Store both sets of points
                setCompletedFarmPoints(completedPoints);
                setPendingFarmPoints(pendingPoints);
                
                // Update the farm observation points based on which tab is active
                setFarmObservationPoints(isShowUnfinishedList ? pendingPoints : completedPoints);
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
              className="flex-row items-center mt-3 p-2"
              onPress={() => {
                setShowFarmObservations(false);
                setSelectedFarm(null);
              }}
            >
              <Feather name="arrow-left" size={20} color="#1B4D3E" />
              <Text className="ml-2 text-primary text-base font-medium">Back to Inspection History</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View className="flex-1 p-4">
        {/* Tab Selection */}
        <View className="flex-row bg-white rounded-xl p-1 mb-4 shadow-sm">
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg ${isShowUnfinishedList ? 'bg-secondary' : ''}`}
            onPress={() => {
              setIsShowUnfinishedList(true);
              // Update farm observation points if they exist
              if (selectedFarm && showFarmObservations) {
                setFarmObservationPoints(pendingFarmPoints);
              }
            }}
          >
            <Text className={`text-base font-medium ${isShowUnfinishedList ? 'text-white font-pbold' : 'text-[#666]'}`}>
              Unfinished ({showFarmObservations ? pendingFarmPoints.length : unfinishedList.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 items-center rounded-lg ${!isShowUnfinishedList ? 'bg-secondary' : ''}`}
            onPress={() => {
              setIsShowUnfinishedList(false);
              // Update farm observation points if they exist
              if (selectedFarm && showFarmObservations) {
                setFarmObservationPoints(completedFarmPoints);
              }
            }}
          >
            <Text className={`text-base font-medium ${!isShowUnfinishedList ? 'text-white font-pbold' : 'text-[#666]'}`}>
              Completed ({showFarmObservations ? completedFarmPoints.length : finishedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading || isDeleting ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#E9762B" />
            <Text className="mt-4 text-base text-[#666]">
              {isDeleting ? 'Deleting all suggestions...' : 'Loading...'}
            </Text>
          </View>
        ) : farms.length === 0 ? (
          /* No Farms Available */
          <View className="flex-1 justify-center items-center py-10">
            <Feather name="home" size={48} color="#ccc" />
            <Text className="mt-4 text-base text-[#999] text-center">
              No farms available. Please add a farm first.
            </Text>
            <TouchableOpacity 
              className="flex-row items-center bg-[#f0f0f0] p-3 rounded-lg mt-4"
              onPress={() => loadData()}
              disabled={isDeleting}
            >
              <Feather name="refresh-cw" size={20} color="#666" />
              <Text className="ml-2 text-[#666] text-base">Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : !selectedFarm ? (
          /* No Farm Selected */
          <View className="flex-1 justify-center items-center py-10">
            <Feather name="map" size={48} color="#ccc" />
            <Text className="mt-4 text-base text-[#999] text-center">
              Please select a farm to view inspection history
            </Text>
            <Text className="mt-2 text-sm text-[#999] text-center italic">
              Use the dropdown above to select a farm
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
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center py-10">
                <Feather name="map-pin" size={48} color="#ccc" />
                <Text className="mt-4 text-base text-[#999] text-center">
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
                    Finished: point.observation_status === 'completed' || point.observation_status === 'Completed' ? 1 : 0,
                    FarmId: selectedFarm.id,
                    Status: point.observation_status || 'Nil',
                    FarmName: selectedFarm.name,
                    FarmSize: selectedFarm.size,
                    SuggestionId: point.inspection_suggestion_id
                  }));
                  
                  // Filter observation points based on status
                  const completedPoints = formattedPoints.filter(point => 
                    point.Status === 'Completed' || point.Status === 'completed'
                  );
                  
                  const pendingPoints = formattedPoints.filter(point => 
                    point.Status !== 'Completed' && point.Status !== 'completed'
                  );
                  
                  // Store both sets of points
                  setCompletedFarmPoints(completedPoints);
                  setPendingFarmPoints(pendingPoints);
                  
                  // Update the farm observation points based on which tab is active
                  setFarmObservationPoints(isShowUnfinishedList ? pendingPoints : completedPoints);
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
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={renderEmptyList}
            onRefresh={loadData}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}


export default History;
