/**
 * Profile Service
 * Handles operations related to user profiles
 */
import databaseService from './DatabaseService';

/**
 * Initialize the profile table
 * @returns {Promise<void>}
 */
export const initProfileTable = async () => {
  try {
    await databaseService.initialize();
    
    // Create profile table
    await databaseService.executeQuery(`
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
    
    if (__DEV__) console.log('Profile table created successfully');
    
    // Check if there's at least one profile record
    const profiles = await databaseService.query('SELECT * FROM profile LIMIT 1');
    
    // If no profile exists, create a default one
    if (profiles.length === 0) {
      await databaseService.insert('profile', {
        user_id: 1,
        first_name: 'Default',
        last_name: 'User',
        phone_number: '',
        address: ''
      });
      
      if (__DEV__) console.log('Default profile created');
    }
  } catch (error) {
    if (__DEV__) console.error('Error initializing profile table:', error);
    throw error;
  }
};

/**
 * Get the user profile
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
export const getProfile = async (userId = 1) => {
  try {
    await databaseService.initialize();
    
    const profiles = await databaseService.getAll(
      'profile',
      'user_id = ?',
      [userId]
    );
    
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    if (__DEV__) console.error('Error getting profile:', error);
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
  try {
    await databaseService.initialize();
    
    // Check if profile exists
    const existingProfile = await getProfile(userId);
    
    if (!existingProfile) {
      // Create new profile
      const { first_name, last_name, phone_number, address, picture_uri } = profileData;
      
      await databaseService.insert('profile', {
        user_id: userId,
        first_name: first_name || '',
        last_name: last_name || '',
        phone_number: phone_number || '',
        address: address || '',
        picture_uri: picture_uri || null,
        updated_at: new Date().toISOString()
      });
    } else {
      // Update existing profile with only the fields that are provided
      const updateData = {};
      
      if ('first_name' in profileData) updateData.first_name = profileData.first_name;
      if ('last_name' in profileData) updateData.last_name = profileData.last_name;
      if ('phone_number' in profileData) updateData.phone_number = profileData.phone_number;
      if ('address' in profileData) updateData.address = profileData.address;
      if ('picture_uri' in profileData) updateData.picture_uri = profileData.picture_uri;
      
      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();
      
      // Execute update
      await databaseService.update(
        'profile',
        updateData,
        'user_id = ?',
        [userId]
      );
    }
    
    // Get updated profile
    return await getProfile(userId);
  } catch (error) {
    if (__DEV__) console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Delete the user profile
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<boolean>} - Success status
 */
export const deleteProfile = async (userId = 1) => {
  try {
    await databaseService.initialize();
    
    await databaseService.delete(
      'profile',
      'user_id = ?',
      [userId]
    );
    
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting profile:', error);
    throw error;
  }
};

/**
 * Get the full name of a user
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<string>} - Full name or 'Unknown User' if not found
 */
export const getFullName = async (userId = 1) => {
  try {
    const profile = await getProfile(userId);
    
    if (!profile) {
      return 'Unknown User';
    }
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    if (!firstName && !lastName) {
      return 'Unknown User';
    }
    
    return `${firstName} ${lastName}`.trim();
  } catch (error) {
    if (__DEV__) console.error('Error getting full name:', error);
    return 'Unknown User';
  }
};

/**
 * Check if a profile exists
 * @param {number} userId - User ID (defaults to 1 for single-user mode)
 * @returns {Promise<boolean>} - True if profile exists, false otherwise
 */
export const profileExists = async (userId = 1) => {
  try {
    const profile = await getProfile(userId);
    return !!profile;
  } catch (error) {
    if (__DEV__) console.error('Error checking if profile exists:', error);
    return false;
  }
};
