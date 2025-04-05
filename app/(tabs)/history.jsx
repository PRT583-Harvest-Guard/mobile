import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordCard } from '@/components';

const allRecords = [
  {
    id: 1,
    Date: "01/01/2025",
    Category: "Pests",
    ConfidenceLevel: "90%",
    InspectionSections: 25,
    InspectedPlantsPerSection: 20,
    Finished: 0
  }, {
    id: 2,
    Date: "01/01/2025",
    Category: "Pests",
    ConfidenceLevel: "90%",
    InspectionSections: 25,
    InspectedPlantsPerSection: 20,
    Finished: 1
  }, {
    id: 3,
    Date: "01/01/2025",
    Category: "Pests",
    ConfidenceLevel: "90%",
    InspectionSections: 25,
    InspectedPlantsPerSection: 20,
    Finished: 1
  }, {
    id: 4,
    Date: "01/01/2025",
    Category: "Pests",
    ConfidenceLevel: "90%",
    InspectionSections: 25,
    InspectedPlantsPerSection: 20,
    Finished: 1
  }, {
    id: 5,
    Date: "01/01/2025",
    Category: "Pests",
    ConfidenceLevel: "90%",
    InspectionSections: 25,
    InspectedPlantsPerSection: 20,
    Finished: 1
  }
];

const History = () => {
  const [unfinishedList, setUnfinishedList] = useState([]);
  const [finishedList, setFinishedList] = useState([]);
  const [isShowUnfinishedList, setIsShowUnfinishedList] = useState(true);

  useEffect(() => {
    setUnfinishedList(allRecords.filter(item => item.Finished === 0));
    setFinishedList(allRecords.filter(item => item.Finished === 1));
  }, [])

  return (
    <SafeAreaView className='w-full h-full'>
      <View className='w-full h-full px-4 flex-col items-center'>
        {/* Header */}
        <Text className='w-full text-2xl text-black font-pregular text-center mb-10'>Inpection History</Text>
        <View className='w-full flex-row items-center justify-between mb-10'>
          <TouchableOpacity
            className={`px-2 py-1 ${isShowUnfinishedList ? 'border-b-2 border-secondary' : ''}`}
            onPress={() => setIsShowUnfinishedList(true)}
          >
            <Text className={`text-xl ${isShowUnfinishedList ? 'font-psemibold text-secondary' : 'font-pregular text-gray-600'}`}>
              Unfinished{" "}({unfinishedList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-2 py-1 ${!isShowUnfinishedList ? 'border-b-2 border-secondary' : ''}`}
            onPress={() => setIsShowUnfinishedList(false)}
          >
            <Text className={`text-xl font-pregular ${!isShowUnfinishedList ? 'font-psemibold text-secondary' : 'font-pregular text-gray-600'}`}>
              Finished{" "}({finishedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show List */}
        {isShowUnfinishedList && (
          <FlatList
            data={unfinishedList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <RecordCard
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles="w-full mb-5"
              />
            )}
            showsVerticalScrollIndicator={false}
            className='w-full -mb-10'
          />
        )}
        {!isShowUnfinishedList && (
          <FlatList
            data={finishedList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <RecordCard
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles="w-full mb-5"
              />
            )}
            showsVerticalScrollIndicator={false}
            className='w-full -mb-10 no-scrollbar'
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default History;
