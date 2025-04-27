import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Modal } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * BoundaryMap component displays a zoomable map with boundary points and polygons.
 */
const BoundaryMap = ({
  points = [],
  style = {},
  showPoints = true,
  lineColor = '#E9762B',
  pointColor = '#E9762B',
  lineWidth = 2,
  pointRadius = 4
}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (points && points.length > 0) {
      // Calculate initial region based on points
      const latitudes = points.map(p => p.latitude);
      const longitudes = points.map(p => p.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
      const lngDelta = (maxLng - minLng) * 1.5;
      
      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    }
  }, [points]);

  if (!points || points.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.emptyText}>No boundary points available</Text>
      </View>
    );
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {points.length > 2 && (
          <Polygon
            coordinates={points.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            fillColor="rgba(233, 118, 43, 0.2)"
            strokeColor="rgba(233, 118, 43, 0.7)"
            strokeWidth={2}
          />
        )}
        
        {showPoints && points.map((point, index) => (
          <Marker
            key={point.id || index}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            onPress={() => setSelectedPoint(point)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      <Modal
        visible={!!selectedPoint}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPoint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedPoint(null)}
            >
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            
            <View style={styles.detailsContent}>
              <Text style={styles.pointTitle}>Point {points.indexOf(selectedPoint) + 1}</Text>
              <Text style={styles.pointDescription}>{selectedPoint?.description}</Text>
              <Text style={styles.pointTimestamp}>
                Captured: {formatDate(selectedPoint?.timestamp)}
              </Text>
              
              {selectedPoint?.photo_uri && (
                <View style={styles.photoContainer}>
                  <Image 
                    source={{ uri: selectedPoint.photo_uri }} 
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#E9762B',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
  },
  detailsContent: {
    marginTop: 8,
  },
  pointTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointDescription: {
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
  },
  pointTimestamp: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
});

export default BoundaryMap;
