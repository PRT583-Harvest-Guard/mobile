import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getBoundaryData } from '../services/BoundaryService';

const FarmLayoutScreen = () => {
  const [boundaryPoints, setBoundaryPoints] = useState([]);

  useEffect(() => {
    loadBoundaryData();
  }, []);

  const loadBoundaryData = async () => {
    try {
      const points = await getBoundaryData();
      setBoundaryPoints(points);
    } catch (error) {
      console.error('Error loading boundary data:', error);
    }
  };

  const prepareChartData = () => {
    if (boundaryPoints.length === 0) return null;

    const latitudes = boundaryPoints.map(point => point.latitude);
    const longitudes = boundaryPoints.map(point => point.longitude);

    return {
      labels: boundaryPoints.map((_, index) => `Point ${index + 1}`),
      datasets: [
        {
          data: latitudes,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: longitudes,
          color: (opacity = 1) => `rgba(244, 65, 134, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  const chartData = prepareChartData();

  return (
    <View style={styles.container}>
      {chartData && (
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 20}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 6,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  }
});

export default FarmLayoutScreen; 