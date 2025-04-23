import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';

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
  const mapRef = useRef(null);

  useEffect(() => {
    if (points.length >= 2 && mapRef.current) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
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
        ref={mapRef}
        style={styles.map}
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
