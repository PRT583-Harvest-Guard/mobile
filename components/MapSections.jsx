import React from 'react';
import { View, Text, ScrollView } from 'react-native';

// Predefined fill colors for each section
const sectionColors = [
  'rgba(233, 118, 43, 0.5)',
  'rgba(76, 175, 80, 0.5)',
  'rgba(33, 150, 243, 0.5)',
  'rgba(156, 39, 176, 0.5)',
  'rgba(255, 235, 59, 0.5)',
  'rgba(0, 188, 212, 0.5)',
  'rgba(255, 87, 34, 0.5)',
  'rgba(121, 85, 72, 0.5)',
  'rgba(63, 81, 181, 0.5)',
  'rgba(139, 195, 74, 0.5)'
];

/**
 * MapSections
 * 
 * Displays a list of observation points for a farm,
 * each in a styled card with section color, coordinates, and observation status.
 *
 * Props:
 *  - markers: Array<{ 
 *      latitude: number, 
 *      longitude: number, 
 *      segment: number, 
 *      observation_status?: string,
 *      name?: string
 *    }>
 */
const MapSections = ({ markers = [] }) => {

  // Ensure markers is an array and filter out invalid markers
  const validMarkers = Array.isArray(markers) 
    ? markers.filter(m => 
        m && 
        typeof m.latitude === 'number' && !isNaN(m.latitude) && 
        typeof m.longitude === 'number' && !isNaN(m.longitude)
      )
    : [];

  if (!validMarkers.length) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-base text-[#666]">No section markers to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {validMarkers.map((m, idx) => {
        try {
          // Ensure segment is a number and default to 1 if not
          const segment = typeof m.segment === 'number' ? m.segment : 1;
          const color = sectionColors[(segment - 1) % sectionColors.length];
          
          // Support both database format (observation_status) and in-memory format (status)
          const status = m.observation_status || m.status || 'Nil';
          
          // Ensure segment is a number for the section name
          const sectionName = m.name || `Section ${segment}`;
          
          return (
            <View 
              key={idx} 
              className={`flex-row items-start bg-white rounded-lg p-3 mb-3 shadow-sm ${status === 'Completed' ? 'bg-[#e8f5e9]' : ''}`}
            >
              <View 
                style={{ backgroundColor: color }} 
                className="w-4 h-4 rounded mt-1 mr-3" 
              />
              <View className="flex-1">
                <Text className="text-base font-pbold mb-1 text-[#333]">
                  {sectionName}: lat {m.latitude.toFixed(5)}, lon {m.longitude.toFixed(5)}
                </Text>
                <Text className="text-sm text-[#555]">
                  Observation status: {status}
                </Text>
              </View>
            </View>
          );
        } catch (error) {
          console.error('Error rendering marker:', error, m);
          return null; // Skip this marker if there's an error
        }
      })}
    </ScrollView>
  );
};


export default MapSections;
