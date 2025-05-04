import * as SQLite from 'expo-sqlite';

let db;

/**
 * Initialize the observations table
 */
export const initObservationsTable = async () => {
  try {
    db = await SQLite.openDatabaseAsync('mobile.db');
    
    // Create observations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        observation_point_id INTEGER NOT NULL,
        identifier TEXT,
        detection BOOLEAN DEFAULT 0,
        severity INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (observation_point_id) REFERENCES observation_points(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Observations table created successfully');
  } catch (error) {
    console.error('Error initializing observations table:', error);
    throw error;
  }
};

/**
 * Get observations for a specific observation point
 * @param {number} observationPointId - Observation point ID
 * @returns {Promise<Array>} - Array of observations
 */
export const getObservations = async (observationPointId) => {
  if (!db) await initObservationsTable();
  
  try {
    // Ensure observationPointId is a number
    const pointId = Number(observationPointId);
    
    // Get observations
    const observations = await db.getAllAsync(`
      SELECT * FROM observations 
      WHERE observation_point_id = ?
      ORDER BY created_at DESC
    `, [pointId]);
    
    console.log(`Found ${observations.length} observations for point ID ${pointId}`);
    
    return observations;
  } catch (error) {
    console.error('Error getting observations:', error);
    throw error;
  }
};

/**
 * Save an observation
 * @param {Object} observation - Observation data
 * @returns {Promise<Object>} - Saved observation
 */
export const saveObservation = async (observation) => {
  if (!db) await initObservationsTable();
  
  try {
    const { 
      farm_id, 
      observation_point_id, 
      identifier, 
      detection, 
      severity, 
      notes 
    } = observation;
    
    // Ensure IDs are numbers
    const farmId = Number(farm_id);
    const pointId = Number(observation_point_id);
    
    // Insert the new observation
    const result = await db.runAsync(
      `INSERT INTO observations 
       (farm_id, observation_point_id, identifier, detection, severity, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        farmId,
        pointId,
        identifier || '',
        detection ? 1 : 0,
        severity || 0,
        notes || ''
      ]
    );

    // Get the newly inserted observation
    const savedObservation = await db.getAllAsync(
      'SELECT * FROM observations WHERE id = ?',
      [result.lastInsertRowId]
    );

    // Update the observation_status in the observation_points table to "Completed"
    await db.runAsync(
      `UPDATE observation_points 
       SET observation_status = 'Completed' 
       WHERE id = ?`,
      [pointId]
    );

    return savedObservation[0];
  } catch (error) {
    console.error('Error saving observation:', error);
    throw error;
  }
};

/**
 * Update an observation
 * @param {number} observationId - Observation ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Updated observation
 */
export const updateObservation = async (observationId, data) => {
  if (!db) await initObservationsTable();
  
  try {
    // Build SET clause
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    // Build parameters array
    const params = [...Object.values(data), observationId];
    
    // Update the observation
    await db.runAsync(
      `UPDATE observations SET ${setClause} WHERE id = ?`,
      params
    );
    
    // Get the updated observation
    const updatedObservation = await db.getAllAsync(
      'SELECT * FROM observations WHERE id = ?',
      [observationId]
    );
    
    if (!updatedObservation || updatedObservation.length === 0) {
      throw new Error('Observation not found after update');
    }
    
    return updatedObservation[0];
  } catch (error) {
    console.error('Error updating observation:', error);
    throw error;
  }
};

/**
 * Delete an observation
 * @param {number} observationId - Observation ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObservation = async (observationId) => {
  if (!db) await initObservationsTable();
  
  try {
    // Delete the observation
    await db.runAsync(
      'DELETE FROM observations WHERE id = ?',
      [observationId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting observation:', error);
    throw error;
  }
};

/**
 * Get the latest observation for a specific observation point
 * @param {number} observationPointId - Observation point ID
 * @returns {Promise<Object|null>} - Latest observation or null if none exists
 */
export const getLatestObservation = async (observationPointId) => {
  if (!db) await initObservationsTable();
  
  try {
    // Ensure observationPointId is a number
    const pointId = Number(observationPointId);
    
    // Get the latest observation
    const observations = await db.getAllAsync(`
      SELECT * FROM observations 
      WHERE observation_point_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [pointId]);
    
    if (observations.length === 0) {
      return null;
    }
    
    return observations[0];
  } catch (error) {
    console.error('Error getting latest observation:', error);
    throw error;
  }
};
