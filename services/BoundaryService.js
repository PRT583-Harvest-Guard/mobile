import * as SQLite from 'expo-sqlite';

let db;

export const initBoundaryTable = async () => {
  try {
    db = await SQLite.openDatabaseAsync('mobile.db');
    
    // Create farms table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        size REAL,
        plant_type TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create boundary_points table with farm_id foreign key
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS boundary_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER,
        latitude REAL,
        longitude REAL,
        timestamp TEXT,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const createFarm = async (farmData) => {
  if (!db) await initBoundaryTable();
  
  try {
    const { name, size, plant_type } = farmData;
    const result = await db.runAsync(
      'INSERT INTO farms (name, size, plant_type) VALUES (?, ?, ?)',
      [name, size, plant_type]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error creating farm:', error);
    throw error;
  }
};

export const getFarms = async () => {
  if (!db) await initBoundaryTable();
  
  try {
    return await db.getAllAsync('SELECT * FROM farms ORDER BY created_at DESC');
  } catch (error) {
    console.error('Error getting farms:', error);
    throw error;
  }
};

export const saveBoundaryData = async (farmId, points) => {
  if (!db) await initBoundaryTable();
  
  try {
    // Clear existing points for this farm
    await db.execAsync('DELETE FROM boundary_points WHERE farm_id = ?', [farmId]);
    
    if (points.length > 0) {
      // Prepare the insert statement
      const values = points.map(point => 
        `(${farmId}, ${point.latitude}, ${point.longitude}, '${new Date().toISOString()}')`
      ).join(',');
      
      await db.execAsync(`
        INSERT INTO boundary_points (farm_id, latitude, longitude, timestamp)
        VALUES ${values}
      `);
    }
  } catch (error) {
    console.error('Error saving boundary data:', error);
    throw error;
  }
};

export const getBoundaryData = async (farmId) => {
  if (!db) await initBoundaryTable();
  
  try {
    return await db.getAllAsync(`
      SELECT * FROM boundary_points 
      WHERE farm_id = ?
      ORDER BY timestamp
    `, [farmId]);
  } catch (error) {
    console.error('Error getting boundary data:', error);
    throw error;
  }
};

export const updateFarm = async (farmId, farmData) => {
  if (!db) {
    console.log('Database not initialized, initializing...');
    await initBoundaryTable();
  }
  
  try {
    const { name, size, plant_type } = farmData;
    console.log('Executing update query with:', { farmId, name, size, plant_type });
    
    // First, verify the farm exists
    const existingFarm = await db.getAllAsync(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );
    
    if (!existingFarm || existingFarm.length === 0) {
      throw new Error('No farm found with the given ID');
    }
    
    // Execute the update
    await db.execAsync(
      `UPDATE farms 
       SET name = ?, size = ?, plant_type = ?
       WHERE id = ?`,
      [name, size, plant_type, farmId]
    );
    
    // Fetch the updated farm with a fresh query
    const updatedFarm = await db.getAllAsync(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );
    
    if (!updatedFarm || updatedFarm.length === 0) {
      throw new Error('Failed to verify farm update');
    }
    
    console.log('Farm before update:', existingFarm[0]);
    console.log('Farm after update:', updatedFarm[0]);
    
    return updatedFarm[0];
  } catch (error) {
    console.error('Error in updateFarm:', error);
    throw new Error(`Failed to update farm: ${error.message}`);
  }
}; 