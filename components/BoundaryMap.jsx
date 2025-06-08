// components/BoundaryMap.jsx

import React, { useEffect, useMemo, useRef } from 'react';
import { Text } from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Polygon,
  Marker,
  Callout
} from 'react-native-maps';

import { polygon as turfPolygon } from '@turf/helpers';
import bbox from '@turf/bbox';
import bboxClip from '@turf/bbox-clip';
import { randomPoint } from '@turf/random';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const sortMarkersClockwise = (markers) => {
  if (markers.length < 3) return markers;

  const centroid = markers.reduce(
    (acc, m) => ({
      latitude: acc.latitude + m.latitude / markers.length,
      longitude: acc.longitude + m.longitude / markers.length,
    }),
    { latitude: 0, longitude: 0 }
  )

  return [...markers].sort((a, b) => {
    const angleA = Math.atan2(a.latitude - centroid.latitude, a.longitude - centroid.longitude);
    const angleB = Math.atan2(b.latitude - centroid.latitude, b.longitude - centroid.longitude);
    return angleA - angleB;
  });
}

export default function BoundaryMap({
  points = [], // [{ latitude, longitude }, …]
  observationPoints = [], // Existing observation points from database
  numSegments, // how many vertical slices
  style = {},
  boundaryColor = '#333',
  boundaryWidth = 2,
  segmentFill = 'rgba(100,150,240,0.2)',
  lineColor = '#E9762B',
  lineWidth = 1,
  pointColor = 'black',
  onMarkerUpdated
}) {
  const mapRef = useRef(null);
  const hasCalledMarkerUpdate = useRef(false);

  // 1️⃣ Build the closed‐loop coordinate array & compute a fit‐region
  const { coords, region, turfPoly, bounds } = useMemo(() => {
    // Ensure points is an array and has at least 3 valid points
    if (!points || !Array.isArray(points) || points.length < 3) {
      return { coords: [], region: null, turfPoly: null, bounds: null };
    }

    // Filter out invalid points
    const validPoints = points.filter(p =>
      p && typeof p.latitude === 'number' && !isNaN(p.latitude) &&
      typeof p.longitude === 'number' && !isNaN(p.longitude)
    );

    if (validPoints.length < 3) {
      return { coords: [], region: null, turfPoly: null, bounds: null };
    }

    // ensure the ring closes
    const ring = validPoints.map(p => [p.longitude, p.latitude]);
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) {
      ring.push(ring[0]);
    }

    try {
      const poly = turfPolygon([ring]);
      const [minX, minY, maxX, maxY] = bbox(poly);

      const latDelta = (maxY - minY) * 1.2 || 0.01;
      const lonDelta = (maxX - minX) * 1.2 || 0.01;

      return {
        coords: validPoints.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude
        })),
        region: {
          latitude: (minY + maxY) / 2,
          longitude: (minX + maxX) / 2,
          latitudeDelta: latDelta,
          longitudeDelta: lonDelta
        },
        turfPoly: poly,
        bounds: { minX, minY, maxX, maxY }
      };
    } catch (error) {
      // Silently handle the error
      return { coords: [], region: null, turfPoly: null, bounds: null };
    }
  }, [points]);

  // 2️⃣ Chop into vertical slices & use existing observation points or generate new ones
  // Use useMemo with a stable dependency array to avoid re-computation
  const { segments, markers } = useMemo(() => {
    if (!turfPoly || !bounds || !numSegments) return { segments: [], markers: [] };

    try {
      const { minX, minY, maxX, maxY } = bounds;
      const sliceWidth = (maxX - minX) / numSegments;

      const segs = [];
      let pts = [];

      // First, create the segments
      for (let i = 0; i < numSegments; i++) {
        const box = [
          minX + i * sliceWidth,
          minY,
          minX + (i + 1) * sliceWidth,
          maxY
        ];

        try {
          const clipped = bboxClip(turfPoly, box);
          const coords = clipped?.geometry?.coordinates?.[0] || [];
          if (coords.length < 3) {
            // skip tiny or empty slices
            continue;
          }

          // build the segment polygon for rendering
          segs.push(
            sortMarkersClockwise(coords).map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
          );
        } catch (error) {
          // Silently handle the error
          continue;
        }
      }

      // If we have existing observation points, use those
      if (observationPoints && Array.isArray(observationPoints) && observationPoints.length > 0) {
        // console.log('Using existing observation points:', observationPoints);
        pts = observationPoints
          .filter(point =>
            point &&
            typeof point.latitude === 'number' && !isNaN(point.latitude) &&
            typeof point.longitude === 'number' && !isNaN(point.longitude)
          )
          .map(point => ({
            latitude: point.latitude,
            longitude: point.longitude,
            segment: point.segment || 1,
            observation_status: point.observation_status || 'Nil',
            name: point.name || `Section ${point.segment || 1}`
          }));
      }
      // Otherwise, generate points for each segment
      else {
        console.log('Generating new observation points');
        for (let i = 0; i < segs.length; i++) {
          const segmentIndex = i + 1;
          const box = [
            minX + i * sliceWidth,
            minY,
            minX + (i + 1) * sliceWidth,
            maxY
          ];

          try {
            const clipped = bboxClip(turfPoly, box);

            // Use a deterministic approach for point generation
            // Instead of random points, use the center of the box
            const centerLat = (box[1] + box[3]) / 2;
            const centerLng = (box[0] + box[2]) / 2;

            // Check if center point is inside the polygon
            const centerPoint = { type: 'Feature', geometry: { type: 'Point', coordinates: [centerLng, centerLat] } };

            if (booleanPointInPolygon(centerPoint, clipped)) {
              pts.push({
                latitude: centerLat,
                longitude: centerLng,
                segment: segmentIndex
              });
            } else {
              // If center is not inside, try to find a point that is
              let feature, attempts = 0;
              do {
                // Use a deterministic approach based on attempt number
                const offsetX = (attempts % 5) * (sliceWidth / 5) - sliceWidth / 2;
                const offsetY = Math.floor(attempts / 5) * ((maxY - minY) / 5) - (maxY - minY) / 2;

                const testLng = centerLng + offsetX;
                const testLat = centerLat + offsetY;

                feature = {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [testLng, testLat]
                  }
                };

                attempts++;
              } while (
                attempts < 25 && // 5x5 grid of test points
                !booleanPointInPolygon(feature, clipped)
              );

              if (attempts < 25) {
                pts.push({
                  latitude: feature.geometry.coordinates[1],
                  longitude: feature.geometry.coordinates[0],
                  segment: segmentIndex
                });
              }
            }
          } catch (error) {
            // Silently handle the error
            continue;
          }
        }
      }

      // Only call onMarkerUpdated if we're generating new points (not using existing ones)
      // and we haven't called it yet for this set of points
      if (onMarkerUpdated && typeof onMarkerUpdated === 'function' &&
        pts.length > 0 && !hasCalledMarkerUpdate.current &&
        (!observationPoints || !Array.isArray(observationPoints) || observationPoints.length === 0)) {
        hasCalledMarkerUpdate.current = true;
        console.log('Calling onMarkerUpdated with generated points');
        // Use setTimeout to ensure this happens after the component has rendered
        setTimeout(() => {
          onMarkerUpdated(pts);
        }, 0);
      }

      return { segments: segs, markers: pts };
    } catch (error) {
      // Silently handle the error
      return { segments: [], markers: [] };
    }
  }, [turfPoly, bounds, numSegments, observationPoints, onMarkerUpdated]);

  // 3️⃣ Center / zoom the map on first render
  useEffect(() => {
    if (mapRef.current && coords.length) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      });
    }
  }, [coords]);

  // Reset the marker update flag when inputs change, but only if observation points change
  useEffect(() => {
    // Only reset if we don't have observation points
    if (!observationPoints || observationPoints.length === 0) {
      hasCalledMarkerUpdate.current = false;
    }
  }, [points, numSegments, observationPoints]);

  if (!region) {
    return null; // not enough pts yet
  }

  console.log(coords);

  return (
    <MapView
      key={markers.map(m => m.id).join(',')}
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[{ flex: 1 }, style]}
      region={region}
    >
      {/* Outer boundary */}
      <Polygon
        coordinates={sortMarkersClockwise(coords)}
        strokeColor={lineColor}
        strokeWidth={boundaryWidth}
        fillColor={segmentFill}
      />

      {/* Sliced segments */}
      {/* {segments.map((polyCoords, i) => (
        <Polygon
          key={`seg-${i}`}
          coordinates={polyCoords}
          strokeColor={lineColor}
          strokeWidth={lineWidth}
          fillColor={segmentFill}
        />
      ))} */}

      {/* One pin per slice */}
      {markers.map((m, i) => (
        <Marker
          key={`mark-${i}`}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          pinColor={pointColor}
        >
          <Callout>
            <Text style={{ fontWeight: 'bold' }}>
              Segment {m.segment}
            </Text>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
