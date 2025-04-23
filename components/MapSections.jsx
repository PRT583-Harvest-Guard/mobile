import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Svg, { Polygon, Line, Circle, Rect } from 'react-native-svg';

const MapSections = ({ points = [] }) => {
  const [normalizedPoints, setNormalizedPoints] = useState([]);
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0 });
  const [mapDimensions, setMapDimensions] = useState({
    width: Dimensions.get('window').width - 64,
    height: 200
  });

  useEffect(() => {
    if (points.length < 3) return;

    const { normalized, width, height } = normalizePoints(points);
    setNormalizedPoints(normalized);
    setMapDimensions({ width, height });

    const sumX = normalized.reduce((sum, p) => sum + p.x, 0);
    const sumY = normalized.reduce((sum, p) => sum + p.y, 0);
    setCenterPoint({
      x: sumX / normalized.length,
      y: sumY / normalized.length
    });
  }, [points]);

  const normalizePoints = (pointsArray) => {
    const validPoints = pointsArray.filter(p =>
      p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
    );

    if (validPoints.length < 3) return { normalized: [], width: 0, height: 0 };

    let minLat = Math.min(...validPoints.map(p => p.latitude));
    let maxLat = Math.max(...validPoints.map(p => p.latitude));
    let minLng = Math.min(...validPoints.map(p => p.longitude));
    let maxLng = Math.max(...validPoints.map(p => p.longitude));

    const latPad = (maxLat - minLat) * 0.1;
    const lngPad = (maxLng - minLng) * 0.1;

    minLat -= latPad;
    maxLat += latPad;
    minLng -= lngPad;
    maxLng += lngPad;

    const boxWidth = maxLng - minLng;
    const boxHeight = maxLat - minLat;
    const ratio = boxWidth / boxHeight;

    const containerWidth = Dimensions.get('window').width - 64;
    let mapWidth = containerWidth;
    let mapHeight = containerWidth / ratio;

    if (mapHeight > 300) {
      mapHeight = 300;
      mapWidth = mapHeight * ratio;
    }

    const normalized = validPoints.map(p => {
      const x = ((p.longitude - minLng) / boxWidth) * mapWidth;
      const y = mapHeight - ((p.latitude - minLat) / boxHeight) * mapHeight;
      return { x, y };
    });

    return { normalized, width: mapWidth, height: mapHeight };
  };

  const createPolygonPoints = (points) => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  if (points.length < 3) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>At least 3 boundary points are required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Land Sections</Text>

      <View style={[styles.mapContainer, { width: mapDimensions.width, height: mapDimensions.height }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}>
          {/* Full land polygon */}
          <Polygon
            points={createPolygonPoints(normalizedPoints)}
            fill="rgba(100, 100, 100, 0.15)"
            stroke="#000"
            strokeWidth="1"
          />

          {/* Quadrant overlays */}
          <Rect
            x="0"
            y="0"
            width={centerPoint.x}
            height={centerPoint.y}
            fill="rgba(233, 118, 43, 0.2)"
          />
          <Rect
            x={centerPoint.x}
            y="0"
            width={mapDimensions.width - centerPoint.x}
            height={centerPoint.y}
            fill="rgba(76, 175, 80, 0.2)"
          />
          <Rect
            x="0"
            y={centerPoint.y}
            width={centerPoint.x}
            height={mapDimensions.height - centerPoint.y}
            fill="rgba(33, 150, 243, 0.2)"
          />
          <Rect
            x={centerPoint.x}
            y={centerPoint.y}
            width={mapDimensions.width - centerPoint.x}
            height={mapDimensions.height - centerPoint.y}
            fill="rgba(156, 39, 176, 0.2)"
          />

          {/* Cross lines */}
          <Line
            x1="0"
            y1={centerPoint.y}
            x2={mapDimensions.width}
            y2={centerPoint.y}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1"
          />
          <Line
            x1={centerPoint.x}
            y1="0"
            x2={centerPoint.x}
            y2={mapDimensions.height}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1"
          />

          {/* Center dot */}
          <Circle cx={centerPoint.x} cy={centerPoint.y} r="4" fill="#E9762B" />
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.sectionsContainer}>
        {[
          { name: 'Section 1', color: 'rgba(233, 118, 43, 0.2)', desc: 'Top-Left' },
          { name: 'Section 2', color: 'rgba(76, 175, 80, 0.2)', desc: 'Top-Right' },
          { name: 'Section 3', color: 'rgba(33, 150, 243, 0.2)', desc: 'Bottom-Left' },
          { name: 'Section 4', color: 'rgba(156, 39, 176, 0.2)', desc: 'Bottom-Right' },
        ].map((section, i) => (
          <View key={i} style={styles.sectionContainer}>
            <View style={[styles.sectionColorBox, { backgroundColor: section.color }]} />
            <Text style={styles.sectionLabel}>{section.name}</Text>
            <Text style={styles.sectionText}>{section.desc} Quadrant</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  mapContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  sectionsContainer: {
    marginTop: 8,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  sectionText: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default MapSections;
