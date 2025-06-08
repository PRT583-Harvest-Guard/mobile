import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const RecordCard = ({
  id,
  date,
  category,
  confidenceLevel,
  inspectionSections,
  plantsPerSection,
  otherStyles,
  status
}) => {
  // Determine the background color based on status
  const getBackgroundColor = () => {
    if (status === 'Completed') {
      return '#e6f7e6'; // Light green for completed
    } else if (status === 'pending') {
      return '#f5f5f5'; // Light gray for pending
    } else if (status === 'cancelled') {
      return '#ffebee'; // Light red for cancelled
    }
    return '#1B4D3E'; // Default color
  };
  
  // Determine the status text color
  const getStatusTextColor = () => {
    if (status === 'Completed') {
      return '#2e7d32'; // Dark green for completed
    } else if (status === 'pending') {
      return '#757575'; // Dark gray for pending
    } else if (status === 'cancelled') {
      return '#c62828'; // Dark red for cancelled
    }
    return '#E9762B'; // Default color
  };
  return (
    <TouchableOpacity 
      className={`w-full p-4 rounded-2xl shadow-sm ${status ? `bg-[${getBackgroundColor()}]` : 'bg-primary'} ${otherStyles || ''}`}
      activeOpacity={0.8}
      onPress={() => {
        // Navigate to observation details page
        router.push(`/observation/${id}`);
      }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-base font-pbold ${status ? `text-[${getStatusTextColor()}]` : 'text-secondary'}`}>{date}</Text>
        <View className={`px-[10px] py-1 rounded-xl ${status ? `bg-[${getStatusTextColor()}]` : 'bg-secondary'}`}>
          <Text className="text-xs font-pbold text-white">{category}</Text>
        </View>
      </View>
      
      <View className="flex-row justify-between mb-2">
        <View className="flex-row items-center">
          <Feather 
            name="percent" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            className="mr-1.5" 
          />
          <Text className={`text-sm ${status ? `text-[${getStatusTextColor()}]` : 'text-white'}`}>
            Confidence: {confidenceLevel}
          </Text>
        </View>
        
        {status && (
          <View className="flex-row items-center">
            <Feather 
              name={status === 'completed' ? "check-circle" : status === 'pending' ? "clock" : "x-circle"} 
              size={16} 
              color={getStatusTextColor()} 
              className="mr-1.5" 
            />
            <Text className={`text-sm text-[${getStatusTextColor()}]`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row justify-between mb-2">
        <View className="flex-row items-center">
          <Feather 
            name="grid" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            className="mr-1.5" 
          />
          <Text className={`text-sm ${status ? `text-[${getStatusTextColor()}]` : 'text-white'}`}>
            Sections: {inspectionSections}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Feather 
            name="layers" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            className="mr-1.5" 
          />
          <Text className={`text-sm ${status ? `text-[${getStatusTextColor()}]` : 'text-white'}`}>
            Plants/Section: {plantsPerSection}
          </Text>
        </View>
      </View>
      
      <View className="items-end mt-2">
        <Feather 
          name="chevron-right" 
          size={20} 
          color={status ? getStatusTextColor() : "#E9762B"} 
        />
      </View>
    </TouchableOpacity>
  );
};


export default RecordCard;
