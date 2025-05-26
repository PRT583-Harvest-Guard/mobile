import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams, Link } from "expo-router";
import {
  getFarms,
} from "@/services/BoundaryService";
import PageHeader from "@/components/PageHeader";
import { Feather } from "@expo/vector-icons";
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-primary py-4 px-2 rounded-b-xl shadow-sm">
        <PageHeader
          title={farmData ? `Boundary: ${farmData.name}` : "Draw Farm Boundary"}
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
        
        <Text className="text-sm text-secondary font-pbold">Draw Boundary</Text>
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
          <Text className="text-lg font-pbold mb-4 text-center text-[#333]">Draw Farm Boundary</Text>
          
          <View className="mb-5 bg-[#f5f5f5] rounded-lg p-4 items-center">
            <Text className="text-base text-[#666] mb-4 text-center">
              Use the map drawing tool to define your farm boundaries by placing points on the map.
            </Text>
            
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-primary py-4 px-5 rounded-lg w-full"
              onPress={() => router.push({
                pathname: "/draw-map",
                params: { farmId }
              })}
            >
              <Feather name="map" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-white text-base font-pbold">Open Map Drawing Tool</Text>
            </TouchableOpacity>
          </View>
          
          {(boundaryStore.existingPoints.length > 0 || boundaryStore.photos.length > 0) && (
            <View className="bg-[#e8f5e8] rounded-lg p-4 items-center">
              <Feather name="check-circle" size={24} color="#1B4D3E" style={{ marginBottom: 8 }} />
              <Text className="text-base text-[#1B4D3E] font-pbold text-center">
                {boundaryStore.existingPoints.length || boundaryStore.photos.length} boundary points saved
              </Text>
              <Text className="text-sm text-[#555] text-center mt-2">
                You can modify your boundary by opening the map drawing tool again.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
