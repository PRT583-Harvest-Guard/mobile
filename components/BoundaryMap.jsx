import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';

/**
 * BoundaryMap component displays a map of boundary points connected by a smooth spline curve.
 * 
 * @param {Object} props
 * @param {Array} props.points - Array of boundary points with latitude and longitude
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.showPoints - Whether to show the boundary points as circles
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
  const [normalizedPoints, setNormalizedPoints] = useState([]);
  const dimensions = {
    width: Dimensions.get('window').width - 64, // Accounting for padding
    height: 200
  };

  useEffect(() => {
    if (points.length < 2) return;

    // Normalize points to fit within the viewport
    const normalized = normalizePoints(points, dimensions);
    setNormalizedPoints(normalized);
  }, [points]); // Only depend on points, not dimensions

  const normalizePoints = (pointsArray, dims) => {
    if (pointsArray.length === 0) return [];

    try {
      // Validate points first to ensure they have valid latitude and longitude
      const validPoints = pointsArray.filter(p => 
        p && 
        typeof p.latitude === 'number' && !isNaN(p.latitude) && 
        typeof p.longitude === 'number' && !isNaN(p.longitude)
      );
      
      if (validPoints.length < 2) {
        console.warn('Not enough valid points for boundary map');
        return [];
      }

      // Find min and max lat/long to determine the bounding box
      let minLat = Math.min(...validPoints.map(p => p.latitude));
      let maxLat = Math.max(...validPoints.map(p => p.latitude));
      let minLng = Math.min(...validPoints.map(p => p.longitude));
      let maxLng = Math.max(...validPoints.map(p => p.longitude));

      // Add some padding (10%)
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;
      
      minLat -= latPadding;
      maxLat += latPadding;
      minLng -= lngPadding;
      maxLng += lngPadding;

      // Calculate the aspect ratio of the bounding box
      const boundingBoxWidth = maxLng - minLng;
      const boundingBoxHeight = maxLat - minLat;
      const boundingBoxRatio = boundingBoxWidth / boundingBoxHeight;
      
      // Adjust the dimensions to maintain the aspect ratio
      let mapWidth = dims.width;
      let mapHeight = dims.width / boundingBoxRatio;
      
      // Cap the height
      if (mapHeight > 300) {
        mapHeight = 300;
        mapWidth = mapHeight * boundingBoxRatio;
      }

      // Normalize points to fit within the viewport
      return validPoints.map(point => {
        // Additional safety check
        if (
          typeof point.longitude !== 'number' || 
          typeof point.latitude !== 'number' ||
          isNaN(point.longitude) || 
          isNaN(point.latitude)
        ) {
          console.warn('Invalid point coordinates:', point);
          return { x: 0, y: 0 }; // Fallback to prevent NaN
        }
        
        // Calculate normalized coordinates
        const x = ((point.longitude - minLng) / boundingBoxWidth) * mapWidth;
        const y = mapHeight - ((point.latitude - minLat) / boundingBoxHeight) * mapHeight; // Invert Y axis
        
        // Final safety check
        return {
          x: isNaN(x) ? 0 : x,
          y: isNaN(y) ? 0 : y
        };
      });
    } catch (error) {
      console.error('Error normalizing points:', error);
      return [];
    }
  };


  if (points.length < 2) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noDataText}>Not enough boundary points to display</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapContainer}>
        {/* Draw boundary points */}
        {showPoints && normalizedPoints.map((point, index) => (
          <View
            key={index}
            style={[
              styles.point,
              {
                left: point.x - pointRadius,
                top: point.y - pointRadius,
                width: pointRadius * 2,
                height: pointRadius * 2,
                backgroundColor: pointColor,
              },
            ]}
          />
        ))}
        
        {/* Draw connecting lines between points */}
        {normalizedPoints.length >= 2 && normalizedPoints.map((point, index) => {
          // Skip the last point
          if (index === normalizedPoints.length - 1) return null;
          
          const nextPoint = normalizedPoints[(index + 1) % normalizedPoints.length];
          
          // Calculate line properties
          const length = Math.sqrt(
            Math.pow(nextPoint.x - point.x, 2) + 
            Math.pow(nextPoint.y - point.y, 2)
          );
          const angle = Math.atan2(
            nextPoint.y - point.y,
            nextPoint.x - point.x
          ) * 180 / Math.PI;
          
          return (
            <View
              key={`line-${index}`}
              style={[
                styles.line,
                {
                  left: point.x,
                  top: point.y,
                  width: length,
                  height: lineWidth,
                  backgroundColor: lineColor,
                  transform: [
                    { translateX: 0 },
                    { translateY: -lineWidth / 2 },
                    { rotate: `${angle}deg` },
                    { translateX: 0 },
                    { translateY: 0 },
                  ],
                },
              ]}
            />
          );
        })}
        
        {/* Draw a filled polygon */}
        {normalizedPoints.length >= 3 && (
          <View style={[
            styles.polygon,
            {
              width: dimensions.width,
              height: dimensions.height,
              backgroundColor: 'rgba(233, 118, 43, 0.1)',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: -1,
            }
          ]} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  point: {
    position: 'absolute',
    borderRadius: 50,
  },
  line: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  polygon: {
    position: 'absolute',
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
