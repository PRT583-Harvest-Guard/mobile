import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PageHeader, CustomButton, FormField } from '@/components';
import { Entities } from '@/constants/Entities';
import { ConfidenceLevels } from '@/constants/ConfidenceLevels';
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
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity 
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled
        ]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={styles.dropdownButtonText}>
          {value || 'Select an option'}
        </Text>
        <Feather 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#333" 
        />
      </TouchableOpacity>
      
      {isOpen && !disabled && (
        <View style={styles.dropdownOptions}>
          <ScrollView 
            nestedScrollEnabled={true}
            style={styles.dropdownScrollView}
            contentContainerStyle={styles.dropdownScrollContent}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const Suggestion = () => {
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
  
  // Prepare data for dropdowns
  const entityOptions = Object.keys(Entities).map(key => 
    key.charAt(0).toUpperCase() + key.slice(1)
  );
  
  const confidenceOptions = ConfidenceLevels.map(level => 
    `${level.confidence_level} - ${level.farmer_explanation}`
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
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
    
    initialize();
  }, []);

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
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we would save the data to the database here
      
      // For now, just navigate to the task page
      router.push("/inspection/task");
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Inspection Suggestion" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E9762B" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Inspection Suggestion" textColor="white" />
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Inspection Suggestion</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.formTitle}>Create Inspection Suggestion</Text>
        
        {!hasFarms && (
          <View style={styles.noFarmsContainer}>
            <Feather name="alert-circle" size={24} color="#E9762B" />
            <Text style={styles.noFarmsText}>
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
        
        <View style={styles.formContainer}>
          <SimpleDropdown
            label="Target Entity"
            options={entityOptions}
            value={targetEntity}
            onSelect={setTargetEntity}
          />
          
          <View style={styles.spacer} />
          
          <SimpleDropdown
            label="Confidence Level"
            options={confidenceOptions}
            value={confidenceLevel}
            onSelect={setConfidenceLevel}
          />
          
          <View style={styles.spacer} />
          
          <SimpleDropdown
            label="Property Location"
            options={farms.map(farm => farm.name)}
            value={propertyLocation}
            onSelect={(selectedName) => {
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
              }
            }}
            disabled={!hasFarms}
          />
          
          <View style={styles.spacer} />
          
          <FormField
            title="Area Size (hectares)"
            placeholder="Auto-populated from farm"
            value={areaSize}
            handleTextChange={setAreaSize}
            keyboardType="numeric"
            editable={false}
          />
          
          <View style={styles.spacer} />
          
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
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Submit"
          handlePress={handleSubmit}
          theme="primary"
          disabled={!isFormValid() || isSubmitting}
          isLoading={isSubmitting}
        />
      </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  noFarmsContainer: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE0C0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  noFarmsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  spacer: {
    height: 16,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
    width: '100%',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1B4D3E',
    borderRadius: 12,
    padding: 16,
    height: 56,
    width: '100%',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOptions: {
    position: 'absolute',
    top: 84, // Height of label (24) + button (56) + margin (4)
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownScrollContent: {
    paddingVertical: 4,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Suggestion;
