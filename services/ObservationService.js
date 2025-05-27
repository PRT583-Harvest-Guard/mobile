/**
 * Observation Service
 * Handles operations related to observation points
 */
import databaseService from './DatabaseService';
import { getBoundaryData } from './BoundaryService';
import config from '../config/env';

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
        user_id INTEGER DEFAULT NULL,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check existing columns and add missing ones
    try {
      const tableInfo = await databaseService.query("PRAGMA table_info(observation_points)");
      const existingColumns = tableInfo.map(column => column.name);
      
      // List of required columns with their definitions
      const requiredColumns = [
        { name: 'observation_id', definition: 'INTEGER' },
        { name: 'observation_status', definition: 'TEXT DEFAULT \'Nil\'' },
        { name: 'name', definition: 'TEXT' },
        { name: 'created_at', definition: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'inspection_suggestion_id', definition: 'INTEGER DEFAULT NULL' },
        { name: 'confidence_level', definition: 'TEXT DEFAULT NULL' },
        { name: 'target_entity', definition: 'TEXT DEFAULT NULL' },
        { name: 'user_id', definition: 'INTEGER DEFAULT NULL' }
      ];
      
      // Add missing columns
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column.name)) {
          try {
            await databaseService.executeQuery(`ALTER TABLE observation_points ADD COLUMN ${column.name} ${column.definition}`);
            if (__DEV__) console.log(`Added missing column: ${column.name}`);
          } catch (error) {
            // Silently ignore column already exists errors
          }
        }
      }
      
      if (__DEV__) console.log('Observation points table schema updated successfully');
    } catch (error) {
      // Silently handle schema update errors
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
 * @param {number} userId - Optional user ID to filter by
 * @returns {Promise<Array>} - Array of observation points
 */
export const getObservationPoints = async (farmId, userId = null) => {
  try {
    await databaseService.initialize();

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);

    // Get observation points, filtered by user ID if provided
    let whereClause = 'farm_id = ?';
    let params = [farmIdNum];
    
    // If userId is provided, add it to the where clause
    if (userId) {
      try {
        // Check if user_id column exists in observation_points table
        const tableInfo = await databaseService.query("PRAGMA table_info(observation_points)");
        const userIdColumnExists = tableInfo.some(column => column.name === 'user_id');
        
        if (userIdColumnExists) {
          whereClause += ' AND (user_id = ? OR user_id IS NULL)';
          params.push(userId);
        }
      } catch (error) {
        // Silently ignore column check errors
      }
    }
    
    const points = await databaseService.getAll(
      'observation_points',
      whereClause,
      params,
      'ORDER BY segment'
    );

    if (__DEV__) console.log(`Found ${points.length} observation points for farm ID ${farmIdNum}${userId ? ` and user ID ${userId}` : ''}`);

    return points;
  } catch (error) {
    // Silently handle errors and return empty array
    console.warn('Error getting observation points, returning empty array');
    return [];
  }
};

/**
 * Get observation points for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of observation points
 */
export const getObservationPointsByUserId = async (userId) => {
  try {
    await databaseService.initialize();

    // Ensure userId is a number
    const userIdNum = Number(userId);
    
    try {
      // Check if user_id column exists in observation_points table
      const tableInfo = await databaseService.query("PRAGMA table_info(observation_points)");
      const userIdColumnExists = tableInfo.some(column => column.name === 'user_id');
      
      if (!userIdColumnExists) {
        return await databaseService.getAll('observation_points', '', [], 'ORDER BY farm_id, segment');
      }
      
      // Get observation points for this user
      const points = await databaseService.getAll(
        'observation_points',
        'user_id = ?',
        [userIdNum],
        'ORDER BY farm_id, segment'
      );
      
      if (__DEV__) console.log(`Found ${points.length} observation points for user ID ${userIdNum}`);
      
      return points;
    } catch (error) {
      return await databaseService.getAll('observation_points', '', [], 'ORDER BY farm_id, segment');
    }
  } catch (error) {
    // Silently handle errors and return empty array
    return [];
  }
};

/**
 * Save an observation point with dynamic column checking
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

    // Check which columns exist in the table
    const tableInfo = await databaseService.query("PRAGMA table_info(observation_points)");
    const existingColumns = tableInfo.map(column => column.name);

    // Build insert data with only existing columns
    const insertData = {
      farm_id: farmIdNum,
      latitude,
      longitude,
      segment
    };

    // Add optional columns only if they exist
    if (existingColumns.includes('observation_id')) {
      insertData.observation_id = observation_id || null;
    }
    if (existingColumns.includes('observation_status')) {
      insertData.observation_status = observation_status || 'Nil';
    }
    if (existingColumns.includes('name')) {
      insertData.name = name || `Section ${segment}`;
    }
    if (existingColumns.includes('inspection_suggestion_id')) {
      insertData.inspection_suggestion_id = inspection_suggestion_id || null;
    }
    if (existingColumns.includes('confidence_level')) {
      insertData.confidence_level = confidence_level || null;
    }
    if (existingColumns.includes('target_entity')) {
      insertData.target_entity = target_entity || null;
    }

    // Insert the new point
    const pointId = await databaseService.insert('observation_points', insertData);

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
  let transactionStarted = false;
  
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

    // Check which columns exist in the table
    const tableInfo = await databaseService.query("PRAGMA table_info(observation_points)");
    const existingColumns = tableInfo.map(column => column.name);

    // Start transaction
    await databaseService.executeQuery('BEGIN TRANSACTION');
    transactionStarted = true;

    // Insert each point
    for (const point of points) {
      // Build insert data with only existing columns
      const insertData = {
        farm_id: farmIdNum,
        latitude: point.latitude,
        longitude: point.longitude,
        segment: point.segment
      };

      // Add optional columns only if they exist
      if (existingColumns.includes('observation_id')) {
        insertData.observation_id = point.observation_id || null;
      }
      if (existingColumns.includes('observation_status')) {
        insertData.observation_status = point.observation_status || 'Nil';
      }
      if (existingColumns.includes('name')) {
        insertData.name = point.name || `Section ${point.segment}`;
      }
      if (existingColumns.includes('inspection_suggestion_id')) {
        insertData.inspection_suggestion_id = point.inspection_suggestion_id || null;
      }
      if (existingColumns.includes('confidence_level')) {
        insertData.confidence_level = point.confidence_level || null;
      }
      if (existingColumns.includes('target_entity')) {
        insertData.target_entity = point.target_entity || null;
      }

      await databaseService.insert('observation_points', insertData);
    }

    // Commit transaction
    await databaseService.executeQuery('COMMIT');
    transactionStarted = false;

    // Get all saved points
    return await getObservationPoints(farmIdNum);
  } catch (error) {
    // Rollback transaction if it was started
    if (transactionStarted) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        // Silently ignore rollback errors
      }
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
    // Silently handle delete errors
    return true;
  }
};

/**
 * Remove duplicate observation points for a farm
 * This function identifies and removes duplicate points that have the same segment number
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeDuplicateObservationPoints = async (farmId) => {
  let transactionStarted = false;
  
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

    // Start transaction
    await databaseService.executeQuery('BEGIN TRANSACTION');
    transactionStarted = true;

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

    // Commit transaction
    await databaseService.executeQuery('COMMIT');
    transactionStarted = false;

    return true;
  } catch (error) {
    // Rollback transaction if it was started
    if (transactionStarted) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        // Silently ignore rollback errors
      }
    }
    if (__DEV__) console.error('Error removing duplicate observation points:', error);
    return false;
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
  let transactionStarted = false;
  
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

    // Start transaction
    await databaseService.executeQuery('BEGIN TRANSACTION');
    transactionStarted = true;

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

    // Commit transaction
    await databaseService.executeQuery('COMMIT');
    transactionStarted = false;

    if (__DEV__) console.log(`Successfully updated ${updatedPoints.length} observation points`);
    return updatedPoints;
  } catch (error) {
    // Rollback transaction if it was started
    if (transactionStarted) {
      try {
        await databaseService.executeQuery('ROLLBACK');
      } catch (rollbackError) {
        // Silently ignore rollback errors
      }
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
