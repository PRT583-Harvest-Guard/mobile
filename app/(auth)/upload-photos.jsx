import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  Switch,
} from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams, Link } from "expo-router";
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader
          title={farmData ? `Boundary: ${farmData.name}` : "Upload Boundary Photos"}
          textColor="white"
          showBackButton={true}
          handleBackPress={() => router.back()}
          backButtonColor="white"
        />
      </View>
      
      <View className="flex-row items-center px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-wrap">
        <Link href="/(tabs)/home" className="mr-1">
          <Text className="text-sm text-primary font-medium">Home</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Link href="/(tabs)/farm" className="mr-1">
          <Text className="text-sm text-primary font-medium">Farm</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Link href={`/farm-details/${farmId}`} className="mr-1">
          <Text className="text-sm text-primary font-medium">Farm Details</Text>
        </Link>
        <Text className="text-sm text-[#999] mr-1"> &gt; </Text>
        
        <Text className="text-sm text-secondary font-pbold">Upload Boundary</Text>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 30 }}>
        {farmData && (
          <View className="w-full max-w-[500px] bg-[#f5f5f5] rounded-lg p-4 mb-5 items-center">
            <Text className="text-xl font-pbold mb-2 text-center">{farmData.name}</Text>
            <Text className="text-base text-[#333] mb-1 text-center">
              Size: {farmData.size ?? "Not specified"} acres
            </Text>
            {farmData.plant_type && (
              <Text className="text-base text-[#333] mb-1 text-center">
                Plants: {farmData.plant_type}
              </Text>
            )}
          </View>
        )}

        <View className="w-full mb-5">
          <Text className="text-lg font-pbold mb-4 text-center text-[#333]">Choose how to add boundary points:</Text>
          
          <View className="mb-5 bg-[#f5f5f5] rounded-lg p-4 items-center">
            <Text className="text-lg font-pbold text-[#333] mb-3">
              {drawOnMap ? 'Draw on Map' : 'Photo Capture'}
            </Text>
            <View className="flex-row items-center justify-center">
              <Text className="text-sm text-[#555] mx-2">Photo Capture</Text>
              <Switch
                value={drawOnMap}
                onValueChange={setDrawOnMap}
                trackColor={{ false: '#E9762B', true: '#1B4D3E' }}
                thumbColor={'#fff'}
                ios_backgroundColor="#E9762B"
              />
              <Text className="text-sm text-[#555] mx-2">Draw on Map</Text>
            </View>
          </View>
          
          {!drawOnMap ? (
            <View className="mb-5">
              {boundaryStore.photos.length > 0 && (
                <Text className="text-lg font-pbold mb-2 text-center text-[#333]">
                  Existing Boundary Points: {boundaryStore.photos.length}
                </Text>
              )}
              <View className="h-[500px]">
                <PhotoCapture
                  photos={boundaryStore.photos}
                  onCapture={(newPhotos) => boundaryStore.setPhotos(newPhotos)}
                  title="Capture boundary points"
                  titleStyles="text-black"
                  farmId={farmId}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-primary py-4 px-5 rounded-lg mt-4"
              onPress={() => router.push({
                pathname: "/draw-map",
                params: { farmId }
              })}
            >
              <Feather name="map" size={24} color="#fff" className="mr-2" />
              <Text className="text-white text-base font-pbold">Open Map Drawing Tool</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {boundaryStore.photos.length >= 3 && (
          <CustomButton
            title="Save Boundary Points"
            handlePress={handleSave}
            containerStyles="mt-5 mb-5 bg-primary"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
