import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';

const MapSections = ({ points = [] }) => {
  const [normalizedPoints, setNormalizedPoints] = useState([]);
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0 });
  const [mapDimensions, setMapDimensions] = useState({
    width: Dimensions.get('window').width - 64,
    height: 200
  });

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

  const sortPointsClockwise = (points, center) => {
    return [...points].sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });
  };

  const createFanSections = () => {
    if (normalizedPoints.length < 3) return [];

    const sorted = sortPointsClockwise(normalizedPoints, centerPoint);
    const sections = [];

    for (let i = 0; i < sorted.length; i++) {
      const p1 = sorted[i];
      const p2 = sorted[(i + 1) % sorted.length]; // wrap around
      sections.push(`${centerPoint.x},${centerPoint.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`);
    }

    return sections;
  };

  const sectionPolygons = createFanSections();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Land Sections</Text>

      <View style={[styles.mapContainer, { width: mapDimensions.width, height: mapDimensions.height }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}>
          {sectionPolygons.map((points, index) => (
            <Polygon
              key={`section-${index}`}
              points={points}
              fill={sectionColors[index % sectionColors.length]}
              stroke="#444"
              strokeWidth="0.5"
            />
          ))}

          <Circle cx={centerPoint.x} cy={centerPoint.y} r="4" fill="#E9762B" />
        </Svg>
      </View>

      <View style={styles.sectionsContainer}>
        {sectionPolygons.map((_, i) => (
          <View key={i} style={styles.sectionContainer}>
            <View style={[styles.sectionColorBox, { backgroundColor: sectionColors[i % sectionColors.length] }]} />
            <Text style={styles.sectionLabel}>Section {i + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  mapContainer: {
    borderRadius: 8,
    backgroundColor: '#eee',
    alignSelf: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionsContainer: {
    marginTop: 4,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionColorBox: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default MapSections;
