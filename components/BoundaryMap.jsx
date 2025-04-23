import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';

/**
 * BoundaryMap component displays a zoomable map with boundary points and polygons.
 * 
 * @param {Object} props
 * @param {Array} props.points - Array of boundary points with latitude and longitude
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.showPoints - Whether to show the boundary points as markers
 * @param {string} props.lineColor - Color of the boundary line
 * @param {string} props.pointColor - Color of the boundary points
 * @param {number} props.lineWidth - Width of the boundary line
 * @param {number} props.pointRadius - Radius of the boundary points
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
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (points.length > 0) {
      const minLat = Math.min(...points.map(p => p.latitude));
      const maxLat = Math.max(...points.map(p => p.latitude));
      const minLng = Math.min(...points.map(p => p.longitude));
      const maxLng = Math.max(...points.map(p => p.longitude));

      // Calculate region to fit all points with a slight margin
      setRegion({
        latitude: (maxLat + minLat) / 2,
        longitude: (maxLng + minLng) / 2,
        latitudeDelta: maxLat - minLat + 0.1,
        longitudeDelta: maxLng - minLng + 0.1
      });
    }
  }, [points]);

  if (points.length < 2) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noDataText}>Not enough boundary points to display</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
      >
        {/* Draw boundary points as markers */}
        {showPoints && points.map((point, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude
            }}
            title={`Point ${index + 1}`}
          />
        ))}

        {/* Draw a filled polygon */}
        {points.length >= 3 && (
          <Polygon
            coordinates={points}
            fillColor="rgba(233, 118, 43, 0.3)"
            strokeColor={lineColor}
            strokeWidth={lineWidth}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  }
});

export default BoundaryMap;
