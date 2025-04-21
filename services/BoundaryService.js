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

export const deleteFarm = async (farmId) => {
  if (!db) await initBoundaryTable();
  
  try {
    // First, verify the farm exists
    const existingFarm = await db.getAllAsync(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );
    
    if (!existingFarm || existingFarm.length === 0) {
      throw new Error('No farm found with the given ID');
    }
    
    // Delete the farm
    await db.execAsync('DELETE FROM farms WHERE id = ?', [farmId]);
    
    // Boundary points will be automatically deleted due to ON DELETE CASCADE
    
    return true;
  } catch (error) {
    console.error('Error deleting farm:', error);
    throw new Error(`Failed to delete farm: ${error.message}`);
  }
};

// Add a specific function just for updating size
export const updateFarmSize = async (farmId, newSize) => {
  if (!db) await initBoundaryTable();
  
  try {
    console.log(`Updating farm ${farmId} size to ${newSize}`);
    
    // Convert to number explicitly
    const sizeValue = Number(newSize);
    
    // Update using a direct SQL statement
    await db.execAsync(`UPDATE farms SET size = ${sizeValue} WHERE id = ${farmId}`);
    
    // Verify the update
    const updatedFarm = await db.getAllAsync('SELECT * FROM farms WHERE id = ?', [farmId]);
    console.log('Farm after size update:', updatedFarm[0]);
    
    return updatedFarm[0];
  } catch (error) {
    console.error('Error updating farm size:', error);
    throw new Error(`Failed to update farm size: ${error.message}`);
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
    console.log('Size type:', typeof size);
    
    // First, verify the farm exists
    const existingFarm = await db.getAllAsync(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );
    
    if (!existingFarm || existingFarm.length === 0) {
      throw new Error('No farm found with the given ID');
    }
    
    console.log('Farm before update:', existingFarm[0]);
    
    // Execute the update with explicit type conversion
    const sizeValue = size !== null ? Number(size) : null;
    console.log('Size value after conversion:', sizeValue, 'type:', typeof sizeValue);
    
    // Try a different approach using runAsync instead of execAsync
    console.log('Attempting update with runAsync...');
    
    // First update just the size to isolate the issue
    await db.runAsync(
      'UPDATE farms SET size = ? WHERE id = ?',
      [sizeValue, farmId]
    );
    
    // Then update the other fields
    await db.runAsync(
      'UPDATE farms SET name = ?, plant_type = ? WHERE id = ?',
      [name, plant_type, farmId]
    );
    
    console.log('Update completed with runAsync');
    
    // Fetch the updated farm with a fresh query
    const updatedFarm = await db.getAllAsync(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );
    
    if (!updatedFarm || updatedFarm.length === 0) {
      throw new Error('Failed to verify farm update');
    }
    
    console.log('Farm after update:', updatedFarm[0]);
    
    // Verify the size value specifically
    const sizeCheck = await db.getAllAsync(
      'SELECT id, size, typeof(size) as size_type FROM farms WHERE id = ?',
      [farmId]
    );
    console.log('Size check after update:', sizeCheck[0]);
    
    return updatedFarm[0];
  } catch (error) {
    console.error('Error in updateFarm:', error);
    throw new Error(`Failed to update farm: ${error.message}`);
  }
};
