import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Modal } from 'react-native';
import MapView, { Marker, Polygon, Callout } from 'react-native-maps';
import { Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [randomPoints, setRandomPoints] = useState([]);

  // Check if a point is inside a polygon using ray casting algorithm
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;
      
      const intersect = ((yi > point.longitude) !== (yj > point.longitude)) && 
                        (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  
  // Calculate distance between two points in meters using the Haversine formula
  const calculateDistance = (point1, point2) => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = point1.latitude * Math.PI / 180;
    const lat2 = point2.latitude * Math.PI / 180;
    const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };
  
  // Check if a point is too close to any existing points
  const isTooClose = (point, existingPoints, minDistance) => {
    for (const existingPoint of existingPoints) {
      const distance = calculateDistance(point, existingPoint);
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  };

  // Generate random points within the boundary polygon, one for each section
  const generateRandomPointsInBoundary = (boundaryPoints, count) => {
    if (!boundaryPoints || boundaryPoints.length < 3) return [];
    
    // Calculate center point
    const latitudes = boundaryPoints.map(p => p.latitude);
    const longitudes = boundaryPoints.map(p => p.longitude);
    
    const centerLat = latitudes.reduce((sum, lat) => sum + lat, 0) / boundaryPoints.length;
    const centerLng = longitudes.reduce((sum, lng) => sum + lng, 0) / boundaryPoints.length;
    const center = { latitude: centerLat, longitude: centerLng };
    
    // Sort boundary points clockwise around center
    const sortedPoints = [...boundaryPoints].sort((a, b) => {
      const angleA = Math.atan2(a.longitude - center.longitude, a.latitude - center.latitude);
      const angleB = Math.atan2(b.longitude - center.longitude, b.latitude - center.latitude);
      return angleA - angleB;
    });
    
    // Create sections - each section is a triangle from center to two adjacent boundary points
    const sections = [];
    for (let i = 0; i < sortedPoints.length; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[(i + 1) % sortedPoints.length];
      sections.push({ 
        index: i,
        p1, 
        p2, 
        center,
        // Generate a color that matches the MapSections component
        color: i < 10 ? [
          'rgba(233, 118, 43, 1)',   // Orange
          'rgba(76, 175, 80, 1)',    // Green
          'rgba(33, 150, 243, 1)',   // Blue
          'rgba(156, 39, 176, 1)',   // Purple
          'rgba(255, 235, 59, 1)',   // Yellow
          'rgba(0, 188, 212, 1)',    // Cyan
          'rgba(255, 87, 34, 1)',    // Deep Orange
          'rgba(121, 85, 72, 1)',    // Brown
          'rgba(63, 81, 181, 1)',    // Indigo
          'rgba(139, 195, 74, 1)'    // Light Green
        ][i] : 'rgba(233, 118, 43, 1)'
      });
    }
    
    // If we have more sections than requested points, select sections evenly distributed
    let sectionsToUse = sections;
    if (sections.length > count) {
      sectionsToUse = [];
      const step = sections.length / count;
      
      for (let i = 0; i < count; i++) {
        const index = Math.floor(i * step);
        sectionsToUse.push(sections[index]);
      }
    }
    
    // Generate one random point for each section with constraints
    const randomPoints = [];
    const minDistanceMeters = 100; // Minimum 100 meters between points
    
    sectionsToUse.forEach((section) => {
      let randomPoint = null;
      let attempts = 0;
      const maxAttempts = 50; // Maximum attempts to find a valid point
      
      // Try to generate a point that meets all constraints
      while (attempts < maxAttempts) {
        attempts++;
        
        // Generate a random point within the triangular section
        const candidatePoint = generateRandomPointInTriangle(
          section.center, 
          section.p1, 
          section.p2
        );
        
        // Check if the point is too close to existing points
        if (!isTooClose(candidatePoint, randomPoints, minDistanceMeters)) {
          randomPoint = candidatePoint;
          break;
        }
      }
      
      // If we couldn't find a valid point after max attempts, use the last generated one
      if (!randomPoint && attempts === maxAttempts) {
        randomPoint = generateRandomPointInTriangle(
          section.center, 
          section.p1, 
          section.p2
        );
      }
      
      randomPoint.title = `Section ${section.index + 1} Point`;
      randomPoint.description = `Random point in section ${section.index + 1}`;
      randomPoint.sectionIndex = section.index;
      randomPoint.color = section.color;
      
      randomPoints.push(randomPoint);
    });
    
    return randomPoints;
  };
  
  // Generate a random point within a triangle using barycentric coordinates
  const generateRandomPointInTriangle = (p1, p2, p3) => {
    // Generate random barycentric coordinates
    let r1 = Math.random();
    let r2 = Math.random();
    
    // Ensure the point is inside the triangle
    if (r1 + r2 > 1) {
      r1 = 1 - r1;
      r2 = 1 - r2;
    }
    
    const r3 = 1 - r1 - r2;
    
    // Calculate the point using barycentric coordinates
    const latitude = r1 * p1.latitude + r2 * p2.latitude + r3 * p3.latitude;
    const longitude = r1 * p1.longitude + r2 * p2.longitude + r3 * p3.longitude;
    
    return {
      latitude,
      longitude
    };
  };

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
      
      // Generate 5 random points within the boundary
      if (points.length > 2) {
        const generatedPoints = generateRandomPointsInBoundary(points, 5);
        setRandomPoints(generatedPoints);
      }
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
        
        {/* Random points as pins - one for each section */}
        {randomPoints.map((point, index) => (
          <Marker
            key={`random-${index}`}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
          >
            <MaterialCommunityIcons 
              name="map-marker" 
              size={30} 
              color={point.color} 
            />
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{point.title}</Text>
                <Text style={styles.calloutDescription}>{point.description}</Text>
              </View>
            </Callout>
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
  calloutContainer: {
    width: 150,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
  },
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
