import * as SQLite from 'expo-sqlite';
import { getBoundaryData } from './BoundaryService';

let db;

/**
 * Initialize the observation_points table
 */
export const initObservationPointsTable = async () => {
  try {
    db = await SQLite.openDatabaseAsync('mobile.db');
    
    // Create observation_points table
    await db.execAsync(`
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
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Observation points table created successfully');
  } catch (error) {
    console.error('Error initializing observation points table:', error);
    throw error;
  }
};

/**
 * Get observation points for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<Array>} - Array of observation points
 */
export const getObservationPoints = async (farmId) => {
  if (!db) await initObservationPointsTable();
  
  try {
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Get observation points
    const points = await db.getAllAsync(`
      SELECT * FROM observation_points 
      WHERE farm_id = ?
      ORDER BY segment
    `, [farmIdNum]);
    
    console.log(`Found ${points.length} observation points for farm ID ${farmIdNum}`);
    
    return points;
  } catch (error) {
    console.error('Error getting observation points:', error);
    throw error;
  }
};

/**
 * Save an observation point
 * @param {Object} point - Observation point data
 * @returns {Promise<Object>} - Saved observation point
 */
export const saveObservationPoint = async (point) => {
  if (!db) await initObservationPointsTable();
  
  try {
    const { farm_id, latitude, longitude, segment, observation_id, observation_status, name } = point;
    
    // Ensure farm_id is a number
    const farmIdNum = Number(farm_id);
    
    // Insert the new point
    const result = await db.runAsync(
      `INSERT INTO observation_points 
       (farm_id, latitude, longitude, segment, observation_id, observation_status, name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        farmIdNum,
        latitude,
        longitude,
        segment,
        observation_id || null,
        observation_status || 'Nil',
        name || `Section ${segment}`
      ]
    );

    // Get the newly inserted point
    const savedPoint = await db.getAllAsync(
      'SELECT * FROM observation_points WHERE id = ?',
      [result.lastInsertRowId]
    );

    return savedPoint[0];
  } catch (error) {
    console.error('Error saving observation point:', error);
    throw error;
  }
};

// Flag to track if a transaction is active
let transactionActive = false;

/**
 * Save multiple observation points
 * @param {number} farmId - Farm ID
 * @param {Array} points - Array of observation points
 * @returns {Promise<Array>} - Array of saved observation points
 */
export const saveObservationPoints = async (farmId, points) => {
  if (!db) await initObservationPointsTable();
  
  try {
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Check if farm already has observation points
    const existingPoints = await getObservationPoints(farmIdNum);
    if (existingPoints.length > 0) {
      console.log(`Farm ${farmIdNum} already has ${existingPoints.length} observation points. Skipping save.`);
      return existingPoints;
    }
    
    console.log(`Saving ${points.length} new observation points for farm ${farmIdNum}`);
    
    // Only begin a transaction if one is not already active
    if (!transactionActive) {
      transactionActive = true;
      await db.execAsync('BEGIN TRANSACTION');
    }
    
    // Insert each point
    for (const point of points) {
      await db.runAsync(
        `INSERT INTO observation_points 
         (farm_id, latitude, longitude, segment, observation_id, observation_status, name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          farmIdNum,
          point.latitude,
          point.longitude,
          point.segment,
          point.observation_id || null,
          point.observation_status || 'Nil',
          point.name || `Section ${point.segment}`
        ]
      );
    }
    
    // Only commit if we started the transaction
    if (transactionActive) {
      await db.execAsync('COMMIT');
      transactionActive = false;
    }
    
    // Get all saved points
    const savedPoints = await getObservationPoints(farmIdNum);
    
    return savedPoints;
  } catch (error) {
    // Only rollback if we started the transaction
    if (transactionActive) {
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      transactionActive = false;
    }
    console.error('Error saving observation points:', error);
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
  if (!db) await initObservationPointsTable();
  
  try {
    // Build SET clause
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    // Build parameters array
    const params = [...Object.values(data), pointId];
    
    // Update the point
    await db.runAsync(
      `UPDATE observation_points SET ${setClause} WHERE id = ?`,
      params
    );
    
    // Get the updated point
    const updatedPoint = await db.getAllAsync(
      'SELECT * FROM observation_points WHERE id = ?',
      [pointId]
    );
    
    if (!updatedPoint || updatedPoint.length === 0) {
      throw new Error('Point not found after update');
    }
    
    return updatedPoint[0];
  } catch (error) {
    console.error('Error updating observation point:', error);
    throw error;
  }
};

/**
 * Delete all observation points for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObservationPoints = async (farmId) => {
  if (!db) await initObservationPointsTable();
  
  try {
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Delete all points for the farm
    await db.runAsync(
      'DELETE FROM observation_points WHERE farm_id = ?',
      [farmIdNum]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting observation points:', error);
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
  if (!db) await initObservationPointsTable();
  
  try {
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Get all points for this farm
    const points = await getObservationPoints(farmIdNum);
    
    if (points.length === 0) {
      console.log(`No observation points found for farm ID ${farmIdNum}`);
      return true;
    }
    
    console.log(`Found ${points.length} observation points for farm ID ${farmIdNum}`);
    
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
      console.log('No duplicate points found');
      return true;
    }
    
    // Only begin a transaction if one is not already active
    if (!transactionActive) {
      transactionActive = true;
      await db.execAsync('BEGIN TRANSACTION');
    }
    
    // For each segment, keep only the first point and delete the rest
    for (const segment in pointsBySegment) {
      const segmentPoints = pointsBySegment[segment];
      if (segmentPoints.length > 1) {
        console.log(`Found ${segmentPoints.length} duplicate points for segment ${segment}`);
        
        // Keep the first point
        const pointToKeep = segmentPoints[0];
        
        // Delete all other points for this segment
        for (let i = 1; i < segmentPoints.length; i++) {
          await db.runAsync(
            'DELETE FROM observation_points WHERE id = ?',
            [segmentPoints[i].id]
          );
        }
        
        console.log(`Kept point ID ${pointToKeep.id} for segment ${segment}, deleted ${segmentPoints.length - 1} duplicates`);
      }
    }
    
    // Only commit if we started the transaction
    if (transactionActive) {
      await db.execAsync('COMMIT');
      transactionActive = false;
    }
    
    return true;
  } catch (error) {
    // Only rollback if we started the transaction
    if (transactionActive) {
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      transactionActive = false;
    }
    console.error('Error removing duplicate observation points:', error);
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
  if (!db) await initObservationPointsTable();
  
  try {
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // First, remove any duplicate points
    await removeDuplicateObservationPoints(farmIdNum);
    
    // Check if farm already has observation points
    const existingPoints = await getObservationPoints(farmIdNum);
    
    if (existingPoints.length > 0) {
      console.log(`Found ${existingPoints.length} existing observation points for farm ID ${farmIdNum}`);
      return existingPoints;
    }
    
    // No existing points, need to generate them
    console.log(`No observation points found for farm ID ${farmIdNum}, generating...`);
    
    // Get boundary points to generate the farm polygon
    const boundaryPoints = await getBoundaryData(farmIdNum);
    
    if (!boundaryPoints || boundaryPoints.length < 3) {
      console.error('Not enough boundary points to generate observation points');
      return [];
    }
    
    // We'll let the BoundaryMap component generate the points
    // This function will be called by the component after generation
    return [];
  } catch (error) {
    console.error('Error in getOrGenerateObservationPoints:', error);
    throw error;
  }
};
