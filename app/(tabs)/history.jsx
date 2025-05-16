// app/(tabs)/history.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecordCard, PageHeader, DropDownField } from '@/components';
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';

import {
  getInspectionObservations,
  getPendingInspectionObservations,
  getCompletedInspectionObservations,
  initInspectionObservationTable,
  getInspectionObservationsByFarmId,
  deleteInspectionObservation,
} from '@/services/InspectionObservationService';
import {
  getInspectionSuggestions,
  getInspectionSuggestionById,
  getInspectionSuggestionsByFarmId,
  initInspectionSuggestionTable,
  deleteInspectionSuggestion,
} from '@/services/InspectionSuggestionService';
import { getFarms, getBoundaryData } from '@/services/BoundaryService';
import { getObservationPoints } from '@/services/ObservationService';
import databaseService from '@/services/DatabaseService';

import styles from '@/styles/historyStyles';

function History() {
  /* ------------------------ state ------------------------ */
  const [unfinishedList, setUnfinishedList] = useState([]);
  const [finishedList, setFinishedList] = useState([]);
  const [isShowUnfinishedList, setIsShowUnfinishedList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);

  const [farmObservationPoints, setFarmObservationPoints] = useState([]);
  const [pendingFarmPoints, setPendingFarmPoints] = useState([]);
  const [completedFarmPoints, setCompletedFarmPoints] = useState([]);
  const [showFarmObservations, setShowFarmObservations] = useState(false);

  /* -------------------- delete all ----------------------- */
  const deleteAllSuggestions = async () => {
    Alert.alert(
      'Delete All Inspections',
      'Are you sure you want to delete all inspection suggestions and observations? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await databaseService.initialize();

              // delete all observations
              const allObservations = await getInspectionObservations();
              await Promise.all(
                allObservations.map((o) => deleteInspectionObservation(o.id))
              );

              // delete all suggestions
              const allSuggestions = await getInspectionSuggestions();
              await Promise.all(
                allSuggestions.map((s) => deleteInspectionSuggestion(s.id))
              );

              // reset local state
              setUnfinishedList([]);
              setFinishedList([]);
              setFarmObservationPoints([]);
              setShowFarmObservations(false);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /* -------------------- load data ------------------------ */
  const loadData = async () => {
    try {
      setLoading(true);

      await initInspectionObservationTable();
      await initInspectionSuggestionTable();

      const [
        farmsData,
        pending,
        completed,
      ] = await Promise.all([
        getFarms(),
        getPendingInspectionObservations(),
        getCompletedInspectionObservations(),
      ]);

      setFarms(farmsData);
      setUnfinishedList(pending);
      setFinishedList(completed);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- mount & focus ---------- */
  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // refresh on focus
      loadData();
      return () => { };
    }, [])
  );

  /* -------------------- UI render ------------------------ */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clipboard" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {isShowUnfinishedList
          ? 'No unfinished inspections found'
          : 'No completed inspections found'}
      </Text>
      <TouchableOpacity
        style={styles.refreshButtonEmpty}
        onPress={loadData}
        disabled={isDeleting}
      >
        <Feather name="refresh-cw" size={20} color="#666" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ---------- header ---------- */}
      <View style={styles.headerContainer}>
        <PageHeader
          title="Inspection History"
          textColor="white"
          showBackButton={false}
        />
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadData}
            disabled={isDeleting}
          >
            <Feather name="refresh-cw" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting && styles.disabledButton,
            ]}
            onPress={deleteAllSuggestions}
            disabled={isDeleting}
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------- breadcrumb ---------- */}
      <View style={styles.breadcrumbContainer}>
        <Link href="/(tabs)/home" style={styles.breadcrumbLink}>
          <Text style={styles.breadcrumbText}>Home</Text>
        </Link>
        <Text style={styles.breadcrumbSeparator}> &gt; </Text>
        <Text style={styles.breadcrumbActiveText}>Inspection History</Text>
      </View>

      {/* ---------- farm dropdown ---------- */}
      {farms.length > 0 && (
        <View style={styles.farmDropdownContainer}>
          <DropDownField
            label="Select Farm"
            data={farms.map((f) => f.name)}
            onSelect={async (_, idx) => {
              const farm = farms[idx];
              setSelectedFarm(farm);
              setLoading(true);
              try {
                const points = await getObservationPoints(farm.id);
                const formatted = points.map((pt) => ({
                  id: pt.id,
                  Date: new Date().toLocaleDateString(),
                  Category: pt.target_entity || 'Unknown',
                  ConfidenceLevel: pt.confidence_level || 'Unknown',
                  InspectionSections: 1,
                  InspectedPlantsPerSection: 0,
                  Finished:
                    pt.observation_status === 'completed' ||
                      pt.observation_status === 'Completed'
                      ? 1
                      : 0,
                  FarmId: farm.id,
                  Status: pt.observation_status || 'Nil',
                  FarmName: farm.name,
                  FarmSize: farm.size,
                  SuggestionId: pt.inspection_suggestion_id,
                }));

                const completed = formatted.filter(
                  (p) =>
                    p.Status === 'Completed' || p.Status === 'completed'
                );
                const pending = formatted.filter(
                  (p) =>
                    p.Status !== 'Completed' && p.Status !== 'completed'
                );

                setCompletedFarmPoints(completed);
                setPendingFarmPoints(pending);
                setFarmObservationPoints(
                  isShowUnfinishedList ? pending : completed
                );
                setShowFarmObservations(true);
              } catch (err) {
                Alert.alert('Error', err.message);
              } finally {
                setLoading(false);
              }
            }}
            selectedVal={selectedFarm?.name}
          />

          {showFarmObservations && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowFarmObservations(false);
                setSelectedFarm(null);
              }}
            >
              <Feather name="arrow-left" size={20} color="#1B4D3E" />
              <Text style={styles.backButtonText}>
                Back to Inspection History
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ---------- tabs ---------- */}
      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              isShowUnfinishedList && styles.activeTabButton,
            ]}
            onPress={() => {
              setIsShowUnfinishedList(true);
              if (selectedFarm && showFarmObservations) {
                setFarmObservationPoints(pendingFarmPoints);
              }
            }}
          >
            <Text
              style={[
                styles.tabText,
                isShowUnfinishedList && styles.activeTabText,
              ]}
            >
              Unfinished (
              {showFarmObservations
                ? pendingFarmPoints.length
                : unfinishedList.length}
              )
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              !isShowUnfinishedList && styles.activeTabButton,
            ]}
            onPress={() => {
              setIsShowUnfinishedList(false);
              if (selectedFarm && showFarmObservations) {
                setFarmObservationPoints(completedFarmPoints);
              }
            }}
          >
            <Text
              style={[
                styles.tabText,
                !isShowUnfinishedList && styles.activeTabText,
              ]}
            >
              Completed (
              {showFarmObservations
                ? completedFarmPoints.length
                : finishedList.length}
              )
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- list / loading ---------- */}
        {loading || isDeleting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E9762B" />
            <Text style={styles.loadingText}>
              {isDeleting ? 'Deleting all suggestions...' : 'Loading...'}
            </Text>
          </View>
        ) : farms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="home" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              No farms available. Please add a farm first.
            </Text>
            <TouchableOpacity
              style={styles.refreshButtonEmpty}
              onPress={loadData}
              disabled={isDeleting}
            >
              <Feather name="refresh-cw" size={20} color="#666" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : !selectedFarm ? (
          <View style={styles.emptyContainer}>
            <Feather name="map" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Please select a farm to view inspection history
            </Text>
            <Text style={styles.emptySubText}>
              Use the dropdown above to select a farm
            </Text>
          </View>
        ) : showFarmObservations ? (
          <FlatList
            data={farmObservationPoints}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RecordCard
                id={item.id}
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles={`mb-4 ${item.Finished ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                status={item.Status}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Feather name="map-pin" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  No observation points found for this farm
                </Text>
              </View>
            )}
            onRefresh={() => {
              if (selectedFarm) {
                getObservationPoints(selectedFarm.id).then((pts) => {
                  const formatted = pts.map((pt) => ({
                    id: pt.id,
                    Date: new Date().toLocaleDateString(),
                    Category: pt.target_entity || 'Unknown',
                    ConfidenceLevel: pt.confidence_level || 'Unknown',
                    InspectionSections: 1,
                    InspectedPlantsPerSection: 0,
                    Finished:
                      pt.observation_status === 'completed' ||
                        pt.observation_status === 'Completed'
                        ? 1
                        : 0,
                    FarmId: selectedFarm.id,
                    Status: pt.observation_status || 'Nil',
                    FarmName: selectedFarm.name,
                    FarmSize: selectedFarm.size,
                    SuggestionId: pt.inspection_suggestion_id,
                  }));

                  const completed = formatted.filter(
                    (p) =>
                      p.Status === 'Completed' || p.Status === 'completed'
                  );
                  const pending = formatted.filter(
                    (p) =>
                      p.Status !== 'Completed' && p.Status !== 'completed'
                  );

                  setCompletedFarmPoints(completed);
                  setPendingFarmPoints(pending);
                  setFarmObservationPoints(
                    isShowUnfinishedList ? pending : completed
                  );
                });
              }
            }}
            refreshing={loading}
          />
        ) : (
          <FlatList
            data={isShowUnfinishedList ? unfinishedList : finishedList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RecordCard
                id={item.id}
                date={item.Date}
                category={item.Category}
                confidenceLevel={item.ConfidenceLevel}
                inspectionSections={item.InspectionSections}
                plantsPerSection={item.InspectedPlantsPerSection}
                otherStyles={`mb-4 ${item.Finished ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                status={item.Status}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
            onRefresh={loadData}
            refreshing={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default History;
