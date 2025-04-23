import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * MapSections component divides the land into four sections and labels each section.
 * 
 * @param {Object} props
 * @param {Array} props.points - Array of boundary points with latitude and longitude
 */
const MapSections = ({ points = [] }) => {
  if (points.length < 4) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>Not enough boundary points to divide the map</Text>
      </View>
    );
  }

  // Find the midpoints of the land to divide into sections
  const minLat = Math.min(...points.map(p => p.latitude));
  const maxLat = Math.max(...points.map(p => p.latitude));
  const minLng = Math.min(...points.map(p => p.longitude));
  const maxLng = Math.max(...points.map(p => p.longitude));

  const midLat = (maxLat + minLat) / 2;
  const midLng = (maxLng + minLng) / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Land Sections</Text>

      {/* Section 1 - Top-left */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Section 1</Text>
        <Text style={styles.sectionText}>Top-left Quadrant (Above {midLat}, Left of {midLng})</Text>
      </View>

      {/* Section 2 - Top-right */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Section 2</Text>
        <Text style={styles.sectionText}>Top-right Quadrant (Above {midLat}, Right of {midLng})</Text>
      </View>

      {/* Section 3 - Bottom-left */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Section 3</Text>
        <Text style={styles.sectionText}>Bottom-left Quadrant (Below {midLat}, Left of {midLng})</Text>
      </View>

      {/* Section 4 - Bottom-right */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>Section 4</Text>
        <Text style={styles.sectionText}>Bottom-right Quadrant (Below {midLat}, Right of {midLng})</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E9762B',
    marginRight: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginTop: 10,
  },
});

export default MapSections;
