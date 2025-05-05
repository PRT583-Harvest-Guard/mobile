import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordCard, PageHeader } from '@/components';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setUnfinishedList(allRecords.filter(item => item.Finished === 0));
      setFinishedList(allRecords.filter(item => item.Finished === 1));
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clipboard" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {isShowUnfinishedList 
          ? "No unfinished inspections found" 
          : "No completed inspections found"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PageHeader title="Inspection History" textColor="white" showBackButton={false} />
      </View>
      
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        
        <Text style={styles.breadcrumbActiveText}>Inspection History</Text>
      </View>
      
      <View style={styles.content}>
        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isShowUnfinishedList && styles.activeTabButton
            ]}
            onPress={() => setIsShowUnfinishedList(true)}
          >
            <Text style={[
              styles.tabText,
              isShowUnfinishedList && styles.activeTabText
            ]}>
              Unfinished ({unfinishedList.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              !isShowUnfinishedList && styles.activeTabButton
            ]}
            onPress={() => setIsShowUnfinishedList(false)}
          >
            <Text style={[
              styles.tabText,
              !isShowUnfinishedList && styles.activeTabText
            ]}>
              Completed ({finishedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E9762B" />
            <Text style={styles.loadingText}>Loading inspection history...</Text>
          </View>
        ) : (
          /* List Content */
          <FlatList
            data={isShowUnfinishedList ? unfinishedList : finishedList}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <RecordCard
                id={item.id}
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles="mb-4"
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    backgroundColor: '#1B4D3E',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#1B4D3E',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  breadcrumbActiveText: {
    fontSize: 14,
    color: '#E9762B',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#E9762B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default History;
