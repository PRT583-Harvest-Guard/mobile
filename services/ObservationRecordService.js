/**
 * Observation Record Service
 * Handles operations related to observation records
 */
import databaseService from './DatabaseService';

/**
 * Initialize the observations table
 * @returns {Promise<void>}
 */
export const initObservationsTable = async () => {
  try {
    await databaseService.initialize();
    
    // Create observations table
    await databaseService.executeQuery(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        observation_point_id INTEGER NOT NULL,
        identifier TEXT,
        detection BOOLEAN DEFAULT 0,
        severity INTEGER DEFAULT 0,
        notes TEXT,
        picture_uri TEXT,
        observation_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (observation_point_id) REFERENCES observation_points(id) ON DELETE CASCADE
      )
    `);

    // Check if picture_uri column exists, if not add it
    try {
      // First check if the column exists
      const tableInfo = await databaseService.query("PRAGMA table_info(observations)");
      const pictureUriColumnExists = tableInfo.some(column => column.name === 'picture_uri');

      if (!pictureUriColumnExists) {
        if (__DEV__) console.log('Adding picture_uri column to observations table');
        await databaseService.executeQuery(`
          ALTER TABLE observations 
          ADD COLUMN picture_uri TEXT
        `);
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking/adding picture_uri column:', error);
      // Continue execution even if this fails
    }
    
    if (__DEV__) console.log('Observations table created/updated successfully');
  } catch (error) {
    if (__DEV__) console.error('Error initializing observations table:', error);
    throw error;
  }
};

/**
 * Get observations for a specific observation point
 * @param {number} observationPointId - Observation point ID
 * @returns {Promise<Array>} - Array of observations
 */
export const getObservations = async (observationPointId) => {
  try {
    await databaseService.initialize();
    
    // Ensure observationPointId is a number
    const pointId = Number(observationPointId);

    // Get observations
    const observations = await databaseService.query(`
      SELECT * FROM observations 
      WHERE observation_point_id = ?
      ORDER BY created_at DESC
    `, [pointId]);
    
    if (__DEV__) console.log(`Found ${observations.length} observations for point ID ${pointId}`);
    
    return observations;
  } catch (error) {
    if (__DEV__) console.error('Error getting observations:', error);
    throw error;
  }
};

/**
 * Save an observation
 * @param {Object} observation - Observation data
 * @returns {Promise<Object>} - Saved observation
 */
export const saveObservation = async (observation) => {
  try {
    await databaseService.initialize();
    
    const { 
      farm_id, 
      observation_point_id, 
      identifier, 
      detection, 
      severity, 
      notes,
      picture_uri
    } = observation;

    // Ensure IDs are numbers
    const farmId = Number(farm_id);
    const pointId = Number(observation_point_id);

    // Insert the new observation
    const observationId = await databaseService.insert('observations', {
      farm_id: farmId,
      observation_point_id: pointId,
      identifier: identifier || '',
      detection: detection ? 1 : 0,
      severity: severity || 0,
      notes: notes || '',
      picture_uri: picture_uri || null
    });

    // Get the newly inserted observation
    const savedObservation = await databaseService.getById('observations', 'id', observationId);

    // Update the observation_status and observation_id in the observation_points table
    await databaseService.update(
      'observation_points',
      {
        observation_status: 'Completed',
        observation_id: observationId
      },
      'id = ?',
      [pointId]
    );

    return savedObservation;
  } catch (error) {
    if (__DEV__) console.error('Error saving observation:', error);
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
  try {
    await databaseService.initialize();
    
    // Update the observation
    await databaseService.update(
      'observations',
      data,
      'id = ?',
      [observationId]
    );
    
    // Get the updated observation
    const updatedObservation = await databaseService.getById('observations', 'id', observationId);
    
    if (!updatedObservation) {
      throw new Error('Observation not found after update');
    }
    
    return updatedObservation;
  } catch (error) {
    if (__DEV__) console.error('Error updating observation:', error);
    throw error;
  }
};

/**
 * Delete an observation
 * @param {number} observationId - Observation ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObservation = async (observationId) => {
  try {
    await databaseService.initialize();
    
    // Delete the observation
    await databaseService.delete(
      'observations',
      'id = ?',
      [observationId]
    );

    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting observation:', error);
    throw error;
  }
};

/**
 * Get the latest observation for a specific observation point
 * @param {number} observationPointId - Observation point ID
 * @returns {Promise<Object|null>} - Latest observation or null if none exists
 */
export const getLatestObservation = async (observationPointId) => {
  try {
    await databaseService.initialize();
    
    // Ensure observationPointId is a number
    const pointId = Number(observationPointId);

    // Get the latest observation
    const observations = await databaseService.query(`
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
    if (__DEV__) console.error('Error getting latest observation:', error);
    throw error;
  }
};

/**
 * Get all observations for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<Array>} - Array of observations
 */
export const getObservationsForFarm = async (farmId) => {
  try {
    await databaseService.initialize();
    
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Get observations
    const observations = await databaseService.query(`
      SELECT o.*, op.name as point_name, op.segment as point_segment
      FROM observations o
      JOIN observation_points op ON o.observation_point_id = op.id
      WHERE o.farm_id = ?
      ORDER BY o.created_at DESC
    `, [farmIdNum]);
    
    if (__DEV__) console.log(`Found ${observations.length} observations for farm ID ${farmIdNum}`);
    
    return observations;
  } catch (error) {
    if (__DEV__) console.error('Error getting observations for farm:', error);
    throw error;
  }
};

/**
 * Delete all observations for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteObservationsForFarm = async (farmId) => {
  try {
    await databaseService.initialize();
    
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Delete all observations for the farm
    await databaseService.delete(
      'observations',
      'farm_id = ?',
      [farmIdNum]
    );
    
    // Reset observation_status and observation_id in observation_points
    await databaseService.update(
      'observation_points',
      {
        observation_status: 'Nil',
        observation_id: null
      },
      'farm_id = ?',
      [farmIdNum]
    );
    
    if (__DEV__) console.log(`Deleted all observations for farm ID ${farmIdNum}`);
    
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting observations for farm:', error);
    throw error;
  }
};
