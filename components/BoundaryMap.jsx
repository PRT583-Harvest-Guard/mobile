// components/BoundaryMap.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
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

export default function BoundaryMap({
  points = [], // [{ latitude, longitude }, …]
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
  const [marker, setMarker] = useState([]);
  const mapRef = useRef(null);

  // 1️⃣ Build the closed‐loop coordinate array & compute a fit‐region
  const { coords, region, turfPoly, bounds } = useMemo(() => {
    if (points.length < 3) return { coords: [], region: null, turfPoly: null, bounds: null };


    // ensure the ring closes
    const ring = points.map(p => [p.longitude, p.latitude]);
    if (
      ring[0][0] !== ring[ring.length - 1][0] ||
      ring[0][1] !== ring[ring.length - 1][1]
    ) {
      ring.push(ring[0]);
    }

    const poly = turfPolygon([ring]);
    const [minX, minY, maxX, maxY] = bbox(poly);

    const latDelta = (maxY - minY) * 1.2 || 0.01;
    const lonDelta = (maxX - minX) * 1.2 || 0.01;

    return {
      coords: points.map(p => ({
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
  }, [points]);

  // 2️⃣ Chop into vertical slices & pick one random point per slice
  const { segments, markers } = useMemo(() => {
    if (!turfPoly || !bounds) return { segments: [], markers: [] };

    const { minX, minY, maxX, maxY } = bounds;
    const sliceWidth = (maxX - minX) / numSegments;

    const segs = [];
    const pts = [];

    for (let i = 0; i < numSegments; i++) {
      const box = [
        minX + i * sliceWidth,
        minY,
        minX + (i + 1) * sliceWidth,
        maxY
      ];

      const clipped = bboxClip(turfPoly, box);
      const coords = clipped?.geometry?.coordinates?.[0] || [];
      if (coords.length < 3) {
        // skip tiny or empty slices
        continue;
      }

      // build the segment polygon for rendering
      segs.push(
        coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
      );

      // drop one random point that *actually* lies inside the clipped poly
      let feature, attempts = 0;
      do {
        feature = randomPoint(1, { bbox: box }).features[0];
        attempts++;
      } while (
        attempts < 10 &&
        !booleanPointInPolygon(feature, clipped)
      );

      if (booleanPointInPolygon(feature, clipped)) {
        pts.push({
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          segment: i + 1
        });
      }
    }
    setMarker(pts);

    return { segments: segs, markers: pts };
  }, [turfPoly, bounds, numSegments]);

  // 3️⃣ Center / zoom the map on first render
  React.useEffect(() => {
    if (mapRef.current && coords.length) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      });
    }
  }, [coords]);

  if (!region) {
    return null; // not enough pts yet
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[styles.map, style]}
      initialRegion={region}
    >
      {/* Outer boundary */}
      <Polygon
        coordinates={coords}
        strokeColor={boundaryColor}
        strokeWidth={boundaryWidth}
        fillColor="transparent"
      />

      {/* Sliced segments */}
      {segments.map((polyCoords, i) => (
        <Polygon
          key={`seg-${i}`}
          coordinates={polyCoords}
          strokeColor={lineColor}
          strokeWidth={lineWidth}
          fillColor={segmentFill}
        />
      ))}

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

const styles = StyleSheet.create({
  map: { flex: 1 }
});