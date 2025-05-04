import * as SQLite from 'expo-sqlite';

let db;

/**
 * Initialize the profile table
 */
export const initProfileTable = async () => {
  try {
    db = await SQLite.openDatabaseAsync('mobile.db');
    
    // Create profile table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        first_name TEXT,
        last_name TEXT,
        phone_number TEXT,
        address TEXT,
        picture_uri TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Profile table created successfully');
    
    // Check if there's at least one profile record
    const profiles = await db.getAllAsync('SELECT * FROM profile LIMIT 1');
    
    // If no profile exists, create a default one
    if (profiles.length === 0) {
      await db.runAsync(`
        INSERT INTO profile (user_id, first_name, last_name, phone_number, address)
        VALUES (1, 'Default', 'User', '', '')
      `);
      console.log('Default profile created');
    }
  } catch (error) {
    console.error('Error initializing profile table:', error);
    throw error;
  }
};

/**
 * Get the user profile
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
export const getProfile = async (userId = 1) => {
  if (!db) await initProfileTable();
  
  try {
    const profiles = await db.getAllAsync(
      'SELECT * FROM profile WHERE user_id = ?',
      [userId]
    );
    
    if (profiles.length === 0) {
      return null;
    }
    
    return profiles[0];
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
};

/**
 * Update the user profile
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated profile
 */
export const updateProfile = async (userId = 1, profileData) => {
  if (!db) await initProfileTable();
  
  try {
    // Check if profile exists
    const existingProfile = await getProfile(userId);
    
    if (!existingProfile) {
      // Create new profile
      const { first_name, last_name, phone_number, address, picture_uri } = profileData;
      
      await db.runAsync(`
        INSERT INTO profile (user_id, first_name, last_name, phone_number, address, picture_uri, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [userId, first_name || '', last_name || '', phone_number || '', address || '', picture_uri || null]);
    } else {
      // Update existing profile
      const setClause = [];
      const params = [];
      
      // Build SET clause dynamically based on provided fields
      if ('first_name' in profileData) {
        setClause.push('first_name = ?');
        params.push(profileData.first_name);
      }
      
      if ('last_name' in profileData) {
        setClause.push('last_name = ?');
        params.push(profileData.last_name);
      }
      
      if ('phone_number' in profileData) {
        setClause.push('phone_number = ?');
        params.push(profileData.phone_number);
      }
      
      if ('address' in profileData) {
        setClause.push('address = ?');
        params.push(profileData.address);
      }
      
      if ('picture_uri' in profileData) {
        setClause.push('picture_uri = ?');
        params.push(profileData.picture_uri);
      }
      
      // Add updated_at timestamp
      setClause.push('updated_at = datetime(\'now\')');
      
      // Add user_id to params
      params.push(userId);
      
      // Execute update
      await db.runAsync(`
        UPDATE profile 
        SET ${setClause.join(', ')} 
        WHERE user_id = ?
      `, params);
    }
    
    // Get updated profile
    return await getProfile(userId);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Delete the user profile
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<boolean>} - Success status
 */
export const deleteProfile = async (userId = 1) => {
  if (!db) await initProfileTable();
  
  try {
    await db.runAsync(
      'DELETE FROM profile WHERE user_id = ?',
      [userId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};
