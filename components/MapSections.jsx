import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

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
  const handleSectionPress = (marker) => {
    if (marker && marker.id) {
      // Navigate to the observation details page
      router.push(`/observation/${marker.id}`);
    } else {
      console.log('Cannot navigate: marker has no ID', marker);
    }
  };

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No section markers to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
            <TouchableOpacity 
              key={idx} 
              style={[
                styles.card,
                status === 'Completed' && styles.completedCard
              ]}
              onPress={() => handleSectionPress(m)}
            >
              <View style={[styles.colorBox, { backgroundColor: color }]} />
              <View style={styles.textContainer}>
                <Text style={styles.sectionText}>
                  {sectionName}: lat {m.latitude.toFixed(5)}, lon {m.longitude.toFixed(5)}
                </Text>
                <Text style={styles.statusText}>
                  Observation status: {status}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        } catch (error) {
          console.error('Error rendering marker:', error, m);
          return null; // Skip this marker if there's an error
        }
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#666'
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2
  },
  completedCard: {
    backgroundColor: '#e8f5e9', // Very light green color
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginTop: 4,
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  sectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  statusText: {
    fontSize: 14,
    color: '#555'
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8
  },
  arrowText: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold'
  }
});

export default MapSections;
