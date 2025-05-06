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
  otherStyles,
  status
}) => {
  // Determine the background color based on status
  const getBackgroundColor = () => {
    if (status === 'completed') {
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
    if (status === 'completed') {
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
      style={[
        styles.container, 
        otherStyles && { marginBottom: 16 },
        status && { backgroundColor: getBackgroundColor() }
      ]}
      activeOpacity={0.8}
      onPress={() => {
        // Navigate to inspection details if needed
        // router.push(`/inspection/${id}`);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.date, status && { color: getStatusTextColor() }]}>{date}</Text>
        <View style={[styles.badge, status && { backgroundColor: getStatusTextColor() }]}>
          <Text style={styles.badgeText}>{category}</Text>
        </View>
      </View>
      
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather 
            name="percent" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            style={styles.icon} 
          />
          <Text style={[
            styles.detailText, 
            status && { color: getStatusTextColor() }
          ]}>
            Confidence: {confidenceLevel}
          </Text>
        </View>
        
        {status && (
          <View style={styles.detailItem}>
            <Feather 
              name={status === 'completed' ? "check-circle" : status === 'pending' ? "clock" : "x-circle"} 
              size={16} 
              color={getStatusTextColor()} 
              style={styles.icon} 
            />
            <Text style={[styles.detailText, { color: getStatusTextColor() }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather 
            name="grid" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            style={styles.icon} 
          />
          <Text style={[
            styles.detailText, 
            status && { color: getStatusTextColor() }
          ]}>
            Sections: {inspectionSections}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Feather 
            name="layers" 
            size={16} 
            color={status ? getStatusTextColor() : "#fff"} 
            style={styles.icon} 
          />
          <Text style={[
            styles.detailText, 
            status && { color: getStatusTextColor() }
          ]}>
            Plants/Section: {plantsPerSection}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Feather 
          name="chevron-right" 
          size={20} 
          color={status ? getStatusTextColor() : "#E9762B"} 
        />
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
