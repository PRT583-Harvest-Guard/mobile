import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
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
import { PhotoCapture } from "@/components";
import useBoundaryStore from "@/store/boundaryStore";

export default function UploadBoundaryScreen() {
  const { farmId } = useLocalSearchParams();
  const [farmData, setFarmData] = useState(null);
  const boundaryStore = useBoundaryStore();

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

        <PhotoCapture
          photos={boundaryStore.photos}
          onCapture={(newPhotos) => boundaryStore.setPhotos(newPhotos)}
          title="Capture boundary points"
          titleStyles="text-black"
          farmId={farmId}
        />
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