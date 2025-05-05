import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const RecordCard = ({
  id,
  date,
  category,
  confidenceLevel,
  inspectionSections,
  plantsPerSection,
  otherStyles
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, otherStyles && { marginBottom: 16 }]}
      activeOpacity={0.8}
      onPress={() => {
        // Navigate to inspection details if needed
        // router.push(`/inspection/${id}`);
      }}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category}</Text>
        </View>
      </View>
      
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather name="percent" size={16} color="#fff" style={styles.icon} />
          <Text style={styles.detailText}>Confidence: {confidenceLevel}</Text>
        </View>
      </View>
      
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather name="grid" size={16} color="#fff" style={styles.icon} />
          <Text style={styles.detailText}>Sections: {inspectionSections}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Feather name="layers" size={16} color="#fff" style={styles.icon} />
          <Text style={styles.detailText}>Plants/Section: {plantsPerSection}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Feather name="chevron-right" size={20} color="#E9762B" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: '#1B4D3E',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E9762B',
  },
  badge: {
    backgroundColor: '#E9762B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
});

export default RecordCard;
