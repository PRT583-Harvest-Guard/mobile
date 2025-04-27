import React, { useState, useEffect } from "react";
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
} from "@/services/BoundaryService";
import PageHeader from "@/components/PageHeader";
import { Feather } from "@expo/vector-icons";

export default function UploadBoundaryScreen() {
  const { farmId } = useLocalSearchParams();
  const [points, setPoints] = useState([]);
  const [farmData, setFarmData] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const existing = await getBoundaryData(farmId);
        if (Array.isArray(existing) && existing.length > 0) {
          setPoints(
            existing.map((p) => ({
              id: p.id,
              uri: p.photoUri,
              latitude: p.latitude,
              longitude: p.longitude,
              timestamp: p.timestamp,
              description: p.description || "",
            }))
          );
        }
        const farms = await getFarms();
        const farm = farms.find((f) => f.id === Number(farmId));
        if (farm) setFarmData(farm);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load farm data or boundary points.");
      }
    };

    loadData();
  }, [farmId]);

  const handleCapturePoint = async () => {
    setIsCapturing(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      const point = {
        id: Date.now().toString(),
        uri: "", // You'll need to implement your photo capture logic
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        description: "",
      };
      
      setPoints((prev) => [...prev, point]);
      await saveBoundaryPoint(farmId, {
        photoUri: point.uri,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp,
        description: point.description,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to capture location or save point.");
    } finally {
      setIsCapturing(false);
    }
  };

  const onDeletePoint = async (index) => {
    const point = points[index];
    Alert.alert(
      "Delete Point",
      "Are you sure you want to delete this point?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBoundaryPoint(point.id);
              setPoints((prev) => prev.filter((_, i) => i !== index));
              Alert.alert("Success", "Point deleted successfully.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete point.");
            }
          },
        },
      ]
    );
  };

  const onEditPoint = async (index) => {
    const point = points[index];
    Alert.prompt(
      "Edit Description",
      "Enter a description for this point:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (desc) => {
            try {
              await updateBoundaryPoint(point.id, desc);
              setPoints((prev) => {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  description: desc
                };
                return updated;
              });
              Alert.alert("Success", "Description updated successfully!");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to update description.");
            }
          },
        },
      ],
      "plain-text",
      point.description || ""
    );
  };

  const handleDeleteAllPoints = async () => {
    Alert.alert(
      "Delete All Points",
      "Are you sure you want to delete all boundary points? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllBoundaryPoints(farmId);
              setPoints([]);
              Alert.alert("Success", "All boundary points have been deleted.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete boundary points.");
            }
          },
        },
      ]
    );
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

        <View style={styles.pointsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Boundary Points</Text>
            {points.length > 0 && (
              <TouchableOpacity
                onPress={handleDeleteAllPoints}
                style={styles.deleteAllButton}
              >
                <Feather name="trash-2" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={points}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item, index }) => (
              <View style={styles.pointItem}>
                <View style={styles.pointInfo}>
                  <Text style={styles.pointTitle}>Point {index + 1}:</Text>
                  <Text style={styles.coordinates}>
                    {item.latitude?.toFixed(6) ?? 'N/A'}, {item.longitude?.toFixed(6) ?? 'N/A'}
                  </Text>
                  {item.description ? (
                    <Text style={styles.description}>{item.description}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => onEditPoint(index)}>
                    <Feather name="edit-2" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeletePoint(index)}
                    style={styles.deleteButton}
                  >
                    <Feather name="trash-2" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                No existing points for this farm.
              </Text>
            )}
          />
        </View>

        <TouchableOpacity
          onPress={handleCapturePoint}
          style={styles.captureButton}
          disabled={isCapturing}
        >
          <Text style={styles.captureButtonText}>
            {isCapturing ? "Capturing..." : "Capture Point"}
          </Text>
        </TouchableOpacity>
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