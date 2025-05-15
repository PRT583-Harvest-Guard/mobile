/**
 * Observation Service
 * Handles operations related to observation points
 */
import databaseService from './DatabaseService';
import { getBoundaryData } from './BoundaryService';
import config from '@/config/env';

// Flag to track if a transaction is active
let transactionActive = false;

/**
 * Initialize the observation_points table
 * @returns {Promise<void>}
 */
export const initObservationPointsTable = async () => {
  try {
    await databaseService.initialize();

    // Create observation_points table
    await databaseService.executeQuery(`
      CREATE TABLE IF NOT EXISTS observation_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        longitude REAL NOT NULL,
        latitude REAL NOT NULL,
        observation_id INTEGER,
        observation_status TEXT DEFAULT 'Nil',
        name TEXT,
        segment INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        inspection_suggestion_id INTEGER DEFAULT NULL,
        confidence_level TEXT DEFAULT NULL,
        target_entity TEXT DEFAULT NULL,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);

    // Add new columns if they don't exist
    try {
      await databaseService.executeQuery(`ALTER TABLE observation_points ADD COLUMN inspection_suggestion_id INTEGER DEFAULT NULL`);
      await databaseService.executeQuery(`ALTER TABLE observation_points ADD COLUMN confidence_level TEXT DEFAULT NULL`);
      await databaseService.executeQuery(`ALTER TABLE observation_points ADD COLUMN target_entity TEXT DEFAULT NULL`);
      if (__DEV__) console.log('Added new columns to observation_points table');
    } catch (error) {
      // Columns might already exist, ignore the error
      if (__DEV__) console.log('New columns might already exist:', error.message);
    }

    if (__DEV__) console.log('Observation points table created successfully');
  } catch (error) {
    if (__DEV__) console.error('Error initializing observation points table:', error);
    throw error;
  }
};

/**
 * Get observation points for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<Array>} - Array of observation points
 */
export const getObservationPoints = async (farmId) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Get observation points
    const points = await databaseService.getAll(
      'observation_points',
      'farm_id = ?',
      [farmIdNum],
      'ORDER BY segment'
    );

    if (__DEV__) console.log(`Found ${points.length} observation points for farm ID ${farmIdNum}`);

    return points;
  } catch (error) {
    if (__DEV__) console.error('Error getting observation points:', error);
    throw error;
  }
};

/**
 * Save an observation point
 * @param {Object} point - Observation point data
 * @returns {Promise<Object>} - Saved observation point
 */
export const saveObservationPoint = async (point) => {
  try {
    await databaseService.initialize();

    const {
      farm_id,
      latitude,
      longitude,
      segment,
      observation_id,
      observation_status,
      name,
      inspection_suggestion_id,
      confidence_level,
      target_entity
    } = point;

    // Ensure farm_id is a number
    const farmIdNum = Number(farm_id);

    // Insert the new point
    const pointId = await databaseService.insert('observation_points', {
      farm_id: farmIdNum,
      latitude,
      longitude,
      segment,
      observation_id: observation_id || null,
      observation_status: observation_status || 'Nil',
      name: name || `Section ${segment}`,
      inspection_suggestion_id: inspection_suggestion_id || null,
      confidence_level: confidence_level || null,
      target_entity: target_entity || null
    });

    // Get the newly inserted point
    return await databaseService.getById('observation_points', 'id', pointId);
  } catch (error) {
    if (__DEV__) console.error('Error saving observation point:', error);
    throw error;
  }
};

/**
 * Save multiple observation points
 * @param {number} farmId - Farm ID
 * @param {Array} points - Array of observation points
 * @returns {Promise<Array>} - Array of saved observation points
 */
export const saveObservationPoints = async (farmId, points) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Check if farm already has observation points
    const existingPoints = await getObservationPoints(farmIdNum);
    if (existingPoints.length > 0) {
      if (__DEV__) console.log(`Farm ${farmIdNum} already has ${existingPoints.length} observation points. Skipping save.`);
      return existingPoints;
    }

    if (__DEV__) console.log(`Saving ${points.length} new observation points for farm ${farmIdNum}`);

    // Only begin a transaction if one is not already active
    if (!transactionActive) {
      transactionActive = true;
      await databaseService.executeQuery('BEGIN TRANSACTION');
    }

    // Insert each point
    for (const point of points) {
      await databaseService.insert('observation_points', {
        farm_id: farmIdNum,
        latitude: point.latitude,
        longitude: point.longitude,
        segment: point.segment,
        observation_id: point.observation_id || null,
        observation_status: point.observation_status || 'Nil',
        name: point.name || `Section ${point.segment}`,
        inspection_suggestion_id: point.inspection_suggestion_id || null,
        confidence_level: point.confidence_level || null,
        target_entity: point.target_entity || null
      });
    }

    // Only commit if we started the transaction
    if (transactionActive) {
      await databaseService.executeQuery('COMMIT');
      transactionActive = false;
    }

    // Get all saved points
    return await getObservationPoints(farmIdNum);
  } catch (error) {
    // Only rollback if we started the transaction
    if (transactionActive) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        if (__DEV__) console.error('Error rolling back transaction:', rollbackError);
      }
      transactionActive = false;
    }
    if (__DEV__) console.error('Error saving observation points:', error);
    throw error;
  }
};

/**
 * Update an observation point
 * @param {number} pointId - Point ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Updated observation point
 */
export const updateObservationPoint = async (pointId, data) => {
  try {
    await databaseService.initialize();

    // Update the point
    await databaseService.update(
      'observation_points',
      data,
      'id = ?',
      [pointId]
    );

    // Get the updated point
    const updatedPoint = await databaseService.getById('observation_points', 'id', pointId);

    if (!updatedPoint) {
      throw new Error('Point not found after update');
    }

    return updatedPoint;
  } catch (error) {
    if (__DEV__) console.error('Error updating observation point:', error);
    throw error;
  }
};

/**
 * Delete all observation points for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObservationPoints = async (farmId) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Delete all points for the farm
    await databaseService.delete(
      'observation_points',
      'farm_id = ?',
      [farmIdNum]
    );

    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting observation points:', error);
    throw error;
  }
};

/**
 * Remove duplicate observation points for a farm
 * This function identifies and removes duplicate points that have the same segment number
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeDuplicateObservationPoints = async (farmId) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Get all points for this farm
    const points = await getObservationPoints(farmIdNum);

    if (points.length === 0) {
      if (__DEV__) console.log(`No observation points found for farm ID ${farmIdNum}`);
      return true;
    }

    if (__DEV__) console.log(`Found ${points.length} observation points for farm ID ${farmIdNum}`);

    // Group points by segment
    const pointsBySegment = {};
    points.forEach(point => {
      if (!pointsBySegment[point.segment]) {
        pointsBySegment[point.segment] = [];
      }
      pointsBySegment[point.segment].push(point);
    });

    // Check if there are any duplicates to remove
    let hasDuplicates = false;
    for (const segment in pointsBySegment) {
      if (pointsBySegment[segment].length > 1) {
        hasDuplicates = true;
        break;
      }
    }

    // If no duplicates, return early
    if (!hasDuplicates) {
      if (__DEV__) console.log('No duplicate points found');
      return true;
    }

    // Only begin a transaction if one is not already active
    if (!transactionActive) {
      transactionActive = true;
      await databaseService.executeQuery('BEGIN TRANSACTION');
    }

    // For each segment, keep only the first point and delete the rest
    for (const segment in pointsBySegment) {
      const segmentPoints = pointsBySegment[segment];
      if (segmentPoints.length > 1) {
        if (__DEV__) console.log(`Found ${segmentPoints.length} duplicate points for segment ${segment}`);

        // Keep the first point
        const pointToKeep = segmentPoints[0];

        // Delete all other points for this segment
        for (let i = 1; i < segmentPoints.length; i++) {
          await databaseService.delete(
            'observation_points',
            'id = ?',
            [segmentPoints[i].id]
          );
        }

        if (__DEV__) console.log(`Kept point ID ${pointToKeep.id} for segment ${segment}, deleted ${segmentPoints.length - 1} duplicates`);
      }
    }

    // Only commit if we started the transaction
    if (transactionActive) {
      await databaseService.executeQuery('COMMIT');
      transactionActive = false;
    }

    return true;
  } catch (error) {
    // Only rollback if we started the transaction
    if (transactionActive) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        if (__DEV__) console.error('Error rolling back transaction:', rollbackError);
      }
      transactionActive = false;
    }
    if (__DEV__) console.error('Error removing duplicate observation points:', error);
    throw error;
  }
};

/**
 * Update observation points with inspection suggestion data
 * @param {number} farmId - Farm ID
 * @param {number} inspectionSuggestionId - Inspection suggestion ID
 * @param {string} confidenceLevel - Confidence level
 * @param {string} targetEntity - Target entity
 * @returns {Promise<Array>} - Array of updated observation points
 */
export const updateObservationPointsWithInspectionData = async (farmId, inspectionSuggestionId, confidenceLevel, targetEntity) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Get all observation points for this farm
    const points = await getObservationPoints(farmIdNum);

    if (points.length === 0) {
      if (__DEV__) console.warn(`No observation points found for farm ID ${farmIdNum}`);
      return [];
    }

    if (__DEV__) console.log(`Updating ${points.length} observation points with inspection data`);

    // Only begin a transaction if one is not already active
    if (!transactionActive) {
      transactionActive = true;
      await databaseService.executeQuery('BEGIN TRANSACTION');
    }

    // Update each point
    const updatedPoints = [];
    for (const point of points) {
      const updateData = {
        inspection_suggestion_id: inspectionSuggestionId,
        confidence_level: confidenceLevel,
        target_entity: targetEntity
      };

      const updatedPoint = await updateObservationPoint(point.id, updateData);
      updatedPoints.push(updatedPoint);
    }

    // Only commit if we started the transaction
    if (transactionActive) {
      await databaseService.executeQuery('COMMIT');
      transactionActive = false;
    }

    if (__DEV__) console.log(`Successfully updated ${updatedPoints.length} observation points`);
    return updatedPoints;
  } catch (error) {
    // Only rollback if we started the transaction
    if (transactionActive) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        if (__DEV__) console.error('Error rolling back transaction:', rollbackError);
      }
      transactionActive = false;
    }
    if (__DEV__) console.error('Error updating observation points with inspection data:', error);
    throw error;
  }
};

/**
 * Get or generate observation points for a farm
 * This function first checks if the farm has observation points in the database
 * If not, it generates random points based on the farm boundary
 * @param {number} farmId - Farm ID
 * @param {number} numSegments - Number of segments to generate (if needed)
 * @returns {Promise<Array>} - Array of observation points
 */
export const getOrGenerateObservationPoints = async (farmId, numSegments = 6) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // First, remove any duplicate points
    await removeDuplicateObservationPoints(farmIdNum);

    // Check if farm already has observation points
    const existingPoints = await getObservationPoints(farmIdNum);

    if (existingPoints.length > 0) {
      if (__DEV__) console.log(`Found ${existingPoints.length} existing observation points for farm ID ${farmIdNum}`);
      return existingPoints;
    }

    // No existing points, need to generate them
    if (__DEV__) console.log(`No observation points found for farm ID ${farmIdNum}, generating...`);

    // Get boundary points to generate the farm polygon
    const boundaryPoints = await getBoundaryData(farmIdNum);

    if (!boundaryPoints || boundaryPoints.length < 3) {
      // Import Alert from react-native
      const { Alert } = require('react-native');

      // Show a popup alert
      Alert.alert(
        "Boundary Points Required",
        "Not enough boundary points to generate observation points. Please add at least 3 boundary points to the farm.",
        [
          {
            text: "OK",
            style: "default"
          }
        ]
      );

      return [];
    }

    // We'll let the BoundaryMap component generate the points
    // This function will be called by the component after generation
    return [];
  } catch (error) {
    if (__DEV__) console.error('Error in getOrGenerateObservationPoints:', error);
    throw error;
  }
};
