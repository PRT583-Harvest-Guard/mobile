import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import {
  getBoundaryData,
  saveBoundaryPoint,
  deleteBoundaryPoint,
  getFarms,
  updateBoundaryPoint,
  deleteAllBoundaryPoints,
  saveBoundaryData,
} from "@/services/BoundaryService";
import PageHeader from "@/components/PageHeader";
import { Feather } from "@expo/vector-icons";
import { PhotoCapture, CustomButton } from "@/components";
import useBoundaryStore from "@/store/boundaryStore";

export default function UploadBoundaryScreen() {
  const { farmId } = useLocalSearchParams();
  const [farmData, setFarmData] = useState(null);
  const boundaryStore = useBoundaryStore();
  const [drawOnMap, setDrawOnMap] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const farms = await getFarms();
        const farm = farms.find((f) => f.id === Number(farmId));
        if (farm) {
          setFarmData(farm);
          boundaryStore.setFarmId(farm.id);
          await boundaryStore.loadExistingPoints(farm.id);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load farm data.");
      }
    };

    loadData();
  }, [farmId]);

  const handleSave = async () => {
    const points = boundaryStore.photos;
    if (points.length < 3) {
      Alert.alert("Error", "Cannot form a boundary with less than three points");
      return;
    }

    try {
      await saveBoundaryData(farmId, points.map(p => ({
        photoUri: p.uri,
        latitude: p.location.latitude,
        longitude: p.location.longitude,
        description: p.description || "",
      })));
      Alert.alert("Success", "Boundary points saved successfully");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save boundary points");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader
        title={farmData ? `Boundary: ${farmData.name}` : "Upload Boundary Photos"}
        textColor="black"
        showBackButton={true}
        handleBackPress={() => router.back()}
        backButtonColor="#1B4D3E"
      />

      <View style={styles.content}>
        {farmData && (
          <View style={styles.farmInfoContainer}>
            <Text style={styles.farmName}>{farmData.name}</Text>
            <Text style={styles.farmDetail}>
              Size: {farmData.size ?? "Not specified"} acres
            </Text>
            {farmData.plant_type && (
              <Text style={styles.farmDetail}>
                Plants: {farmData.plant_type}
              </Text>
            )}
          </View>
        )}

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Choose how to add boundary points:</Text>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {drawOnMap ? 'Draw on Map' : 'Photo Capture'}
            </Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleOption}>Photo Capture</Text>
              <Switch
                value={drawOnMap}
                onValueChange={setDrawOnMap}
                trackColor={{ false: '#E9762B', true: '#1B4D3E' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#E9762B"
              />
              <Text style={styles.toggleOption}>Draw on Map</Text>
            </View>
          </View>
          
          {!drawOnMap ? (
            <PhotoCapture
              photos={boundaryStore.photos}
              onCapture={(newPhotos) => boundaryStore.setPhotos(newPhotos)}
              title="Capture boundary points"
              titleStyles="text-black"
              farmId={farmId}
            />
          ) : (
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => router.push({
                pathname: "/draw-map",
                params: { farmId }
              })}
            >
              <Feather name="map" size={24} color="#fff" style={styles.mapButtonIcon} />
              <Text style={styles.mapButtonText}>Open Map Drawing Tool</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  farmInfoContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  farmName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  farmDetail: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  toggleContainer: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOption: {
    fontSize: 14,
    color: '#555',
    marginHorizontal: 8,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B4D3E",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  mapButtonIcon: {
    marginRight: 8,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pointsContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  flatListContent: {
    flexGrow: 1,
  },
  pointItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pointInfo: {
    flex: 1,
  },
  pointTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#666",
  },
  description: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    marginLeft: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    paddingVertical: 16,
  },
  captureButton: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteAllButton: {
    padding: 8,
  },
});
