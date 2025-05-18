import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PageHeader, CustomButton, FormField } from '@/components';
import { Entities } from '@/constants/Entities';
import { ConfidenceLevels } from '@/constants/ConfidenceLevels';
import { 
  initInspectionSuggestionTable, 
  createInspectionSuggestionWithObservations,
  checkExistingSuggestionForFarm,
  deleteInspectionSuggestion
} from '@/services/InspectionSuggestionService';
import { getFarms } from '@/services/BoundaryService';

// Simple component for dropdown selection
const SimpleDropdown = ({ label, options, value, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (isOpen) {
      const closeDropdown = () => setIsOpen(false);
      // Add a timeout to allow the current click event to complete
      const timeoutId = setTimeout(() => {
        const subscription = Dimensions.addEventListener('change', closeDropdown);
        return () => {
          subscription.remove();
          clearTimeout(timeoutId);
        };
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);
  
  return (
    <View className="mb-4 w-full">
      <Text className="text-base font-pbold mb-2 text-[#333]">{label}</Text>
      <TouchableOpacity 
        className={`flex-row justify-between items-center bg-white border-2 border-primary rounded-xl p-4 h-[56px] w-full ${disabled ? 'bg-[#f0f0f0] border-[#ccc]' : ''}`}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text className="text-base text-[#333]">
          {value || 'Select an option'}
        </Text>
        <Feather 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#333" 
        />
      </TouchableOpacity>
      
      {isOpen && !disabled && (
        <View className="absolute top-[84px] left-0 right-0 bg-white border border-[#ddd] rounded-lg max-h-[200px] z-10 shadow-md">
          <ScrollView 
            nestedScrollEnabled={true}
            className="max-h-[200px]"
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                className="p-3 border-b border-[#eee]"
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text className="text-base text-[#333]">{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function Suggestion() {
  // Form state
  const [targetEntity, setTargetEntity] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [areaSize, setAreaSize] = useState('');
  const [densityOfPlant, setDensityOfPlant] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [farms, setFarms] = useState([]);
  const [hasFarms, setHasFarms] = useState(false);
  const [existingSuggestion, setExistingSuggestion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Prepare data for dropdowns
  const entityOptions = Object.keys(Entities).map(key => 
    key.charAt(0).toUpperCase() + key.slice(1)
  );
  
  const confidenceOptions = ConfidenceLevels.map(level => 
    `${level.confidence_level} - ${level.farmer_explanation}`
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the tables
      await initInspectionSuggestionTable();
      
      // Load farms for dropdown
      const farmsData = await getFarms();
      
      if (farmsData && Array.isArray(farmsData) && farmsData.length > 0) {
        const farmOptions = farmsData.map(farm => farm.name);
        setFarms(farmsData);
        setHasFarms(true);
      } else {
        setFarms([]);
        setHasFarms(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing:', error);
      Alert.alert('Error', 'Failed to load data');
      setIsLoading(false);
    }
  };

  // Load data when the component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Also load data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Suggestion screen focused, reloading data...');
      loadData();
      return () => {
        // Cleanup function when screen goes out of focus
        console.log('Suggestion screen unfocused');
      };
    }, [])
  );

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      targetEntity !== '' &&
      confidenceLevel !== '' &&
      (propertyLocation !== '' || !hasFarms) &&
      areaSize !== '' &&
      densityOfPlant !== ''
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Check if there's an existing suggestion
    if (existingSuggestion) {
      Alert.alert(
        "Existing Suggestion",
        "This farm already has an inspection suggestion. Please delete the existing suggestion before creating a new one.",
        [
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Extract the farm ID from the selected farm
      const farmId = selectedFarm ? selectedFarm.id : null;
      
      if (!farmId) {
        throw new Error('No farm selected');
      }
      
      // Check again for existing suggestions (in case one was created since the farm was selected)
      const { exists } = await checkExistingSuggestionForFarm(farmId);
      if (exists) {
        setIsSubmitting(false);
        Alert.alert(
          "Existing Suggestion",
          "Another inspection suggestion was created for this farm. Please refresh and try again.",
          [
            {
              text: "Refresh",
              onPress: () => loadData()
            }
          ]
        );
        return;
      }
      
      // Extract just the confidence percentage from the selected confidence level
      const confidencePercentage = confidenceLevel.split(' - ')[0];
      
      // Create the suggestion data
      const suggestionData = {
        target_entity: targetEntity,
        confidence_level: confidencePercentage,
        property_location: farmId,
        area_size: parseFloat(areaSize),
        density_of_plant: parseInt(densityOfPlant, 10)
      };
      
      // Create the suggestion and observations with user ID (using 1 as default for now)
      const userId = 1; // In a real app, this would come from authentication context
      
      // Add more detailed logging
      console.log('Creating suggestion with data:', JSON.stringify(suggestionData));
      console.log('Using user ID:', userId);
      
      try {
        const result = await createInspectionSuggestionWithObservations(suggestionData, userId);
        
        console.log('Created suggestion with ID:', result.suggestionId);
        console.log('Created observations:', result.observationIds);
        
        // Add a delay before navigating to ensure data is saved
        setTimeout(() => {
          // Navigate to the history page instead of the task page
          router.push("/(tabs)/history");
        }, 1000);
      } catch (error) {
        // Check if the error is about missing boundary points
        if (error.message.includes('boundary points')) {
          Alert.alert(
            "Boundary Points Required",
            "Cannot create inspection without boundary points. Please add boundary points to the farm first.",
            [
              {
                text: "Go to Farm",
                onPress: () => router.push(`/farm-details/${farmId}`),
              },
              {
                text: "OK",
                style: "cancel"
              }
            ]
          );
        } else {
          // For other errors, show the generic error message
          Alert.alert("Error", error.message);
        }
        throw error; // Re-throw the error to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f7fa]">
        <PageHeader title="Inspection Suggestion" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E9762B" />
          <Text className="mt-4 text-base text-[#666]">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f7fa]">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader title="Inspection Suggestion" textColor="white" />
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Inspection Suggestion</Text>
      </View>
      
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-xl font-pbold text-[#333] mb-4 text-center">Create Inspection Suggestion</Text>
        
        {!hasFarms && (
          <View className="bg-[#FFF8F0] border border-[#FFE0C0] rounded-lg p-4 mb-4 items-center">
            <Feather name="alert-circle" size={24} color="#E9762B" />
            <Text className="text-sm text-[#333] text-center mt-2 mb-2">
              You don't have any farms. Please add a farm first.
            </Text>
            <CustomButton
              title="Add Farm"
              theme="primary"
              containerStyles="mt-2"
              handlePress={() => router.push("/(tabs)/farm")}
            />
          </View>
        )}
        
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <SimpleDropdown
            label="Target Entity"
            options={entityOptions}
            value={targetEntity}
            onSelect={setTargetEntity}
          />
          
          <View className="h-4" />
          
          <SimpleDropdown
            label="Confidence Level"
            options={confidenceOptions}
            value={confidenceLevel}
            onSelect={setConfidenceLevel}
          />
          
          <View className="h-4" />
          
          <SimpleDropdown
            label="Property Location"
            options={farms.map(farm => farm.name)}
            value={propertyLocation}
            onSelect={async (selectedName) => {
              setPropertyLocation(selectedName);
              
              // Find the selected farm
              const farm = farms.find(farm => farm.name === selectedName);
              setSelectedFarm(farm);
              
              if (farm) {
                // Auto-populate area size from farm size
                setAreaSize(farm.size ? farm.size.toString() : '0');
                
                // Calculate plant density based on size
                // Using a simple formula: 10 plants per square meter as a base density
                const size = parseFloat(farm.size || 0);
                const density = size > 0 ? Math.round(10 * (1 + (1 / size))).toString() : '0';
                setDensityOfPlant(density);
                
                // Check if there's an existing suggestion for this farm
                try {
                  const { exists, suggestion } = await checkExistingSuggestionForFarm(farm.id);
                  if (exists) {
                    setExistingSuggestion(suggestion);
                  } else {
                    setExistingSuggestion(null);
                  }
                } catch (error) {
                  console.error('Error checking existing suggestion:', error);
                  setExistingSuggestion(null);
                }
              }
            }}
            disabled={!hasFarms}
          />
          
          <View className="h-4" />
          
          {existingSuggestion && (
            <View className="bg-[#FFF8F0] border border-[#FFE0C0] rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Feather name="alert-triangle" size={20} color="#E9762B" className="mr-2" />
                <Text className="text-base font-pbold text-[#E9762B]">Existing Suggestion Found</Text>
              </View>
              <Text className="text-sm text-[#333] mb-3">
                This farm already has an inspection suggestion. You must delete the existing suggestion before creating a new one.
              </Text>
              <View className="flex-row">
                <CustomButton
                  title={isDeleting ? "Deleting..." : "Delete Existing Suggestion"}
                  containerStyles="bg-red-500 flex-1"
                  handlePress={async () => {
                    try {
                      setIsDeleting(true);
                      await deleteInspectionSuggestion(existingSuggestion.id);
                      setExistingSuggestion(null);
                      Alert.alert("Success", "Existing suggestion deleted successfully");
                    } catch (error) {
                      console.error('Error deleting suggestion:', error);
                      Alert.alert("Error", "Failed to delete existing suggestion");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                />
              </View>
            </View>
          )}
          
          <FormField
            title="Area Size (hectares)"
            placeholder="Auto-populated from farm"
            value={areaSize}
            handleTextChange={setAreaSize}
            keyboardType="numeric"
            editable={false}
          />
          
          <View className="h-4" />
          
          <FormField
            title="Density of Plants (plants per square meter)"
            placeholder="Auto-calculated based on size"
            value={densityOfPlant}
            handleTextChange={setDensityOfPlant}
            keyboardType="numeric"
            editable={false}
          />
        </View>
      </ScrollView>
      
      <View className="p-4 bg-white border-t border-[#eee] shadow-sm">
        <CustomButton
          title="Submit"
          handlePress={handleSubmit}
          theme="primary"
          disabled={!isFormValid() || isSubmitting || existingSuggestion !== null}
          isLoading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
};
