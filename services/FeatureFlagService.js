/**
 * Feature Flag Service
 * Handles operations related to feature flags
 */
import databaseService from './DatabaseService';

/**
 * Initialize the feature_flags table
 * @returns {Promise<void>}
 */
export const initFeatureFlagsTable = async () => {
  try {
    await databaseService.initialize();
    
    // Create feature_flags table
    await databaseService.executeQuery(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 0,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default feature flags if they don't exist
    await databaseService.executeQuery(`
      INSERT OR IGNORE INTO feature_flags (name, enabled, description)
      VALUES ('delete_farm', 0, 'Allow farmers to delete their farms and all associated data')
    `);
    
    if (__DEV__) console.log('Feature flags table initialized successfully');
  } catch (error) {
    if (__DEV__) console.error('Error initializing feature flags table:', error);
    throw error;
  }
};

/**
 * Get all feature flags
 * @returns {Promise<Array>} - Array of feature flags
 */
export const getFeatureFlags = async () => {
  try {
    await databaseService.initialize();
    return await databaseService.getAll('feature_flags');
  } catch (error) {
    if (__DEV__) console.error('Error getting feature flags:', error);
    throw error;
  }
};

/**
 * Get a specific feature flag by name
 * @param {string} name - Feature flag name
 * @returns {Promise<Object|null>} - Feature flag or null if not found
 */
export const getFeatureFlag = async (name) => {
  try {
    await databaseService.initialize();
    
    const flags = await databaseService.getAll(
      'feature_flags',
      'name = ?',
      [name]
    );
    
    return flags.length > 0 ? flags[0] : null;
  } catch (error) {
    if (__DEV__) console.error(`Error getting feature flag '${name}':`, error);
    throw error;
  }
};

/**
 * Check if a feature flag is enabled
 * @param {string} name - Feature flag name
 * @returns {Promise<boolean>} - True if enabled, false otherwise
 */
export const isFeatureEnabled = async (name) => {
  try {
    const flag = await getFeatureFlag(name);
    return flag ? flag.enabled === 1 : false;
  } catch (error) {
    if (__DEV__) console.error(`Error checking if feature '${name}' is enabled:`, error);
    return false; // Default to disabled on error
  }
};

/**
 * Update a feature flag
 * @param {string} name - Feature flag name
 * @param {boolean} enabled - Whether the feature is enabled
 * @returns {Promise<boolean>} - Success status
 */
export const updateFeatureFlag = async (name, enabled) => {
  try {
    await databaseService.initialize();
    
    await databaseService.update(
      'feature_flags',
      { enabled: enabled ? 1 : 0 },
      'name = ?',
      [name]
    );
    
    return true;
  } catch (error) {
    if (__DEV__) console.error(`Error updating feature flag '${name}':`, error);
    throw error;
  }
};

/**
 * Create a new feature flag
 * @param {string} name - Feature flag name
 * @param {boolean} enabled - Whether the feature is enabled
 * @param {string} description - Feature flag description
 * @returns {Promise<Object>} - Created feature flag
 */
export const createFeatureFlag = async (name, enabled = false, description = '') => {
  try {
    await databaseService.initialize();
    
    // Check if the feature flag already exists
    const existingFlag = await getFeatureFlag(name);
    if (existingFlag) {
      if (__DEV__) console.log(`Feature flag '${name}' already exists, updating instead`);
      await updateFeatureFlag(name, enabled);
      return await getFeatureFlag(name);
    }
    
    // Insert the new feature flag
    await databaseService.insert('feature_flags', {
      name,
      enabled: enabled ? 1 : 0,
      description
    });
    
    return await getFeatureFlag(name);
  } catch (error) {
    if (__DEV__) console.error(`Error creating feature flag '${name}':`, error);
    throw error;
  }
};

/**
 * Delete a feature flag
 * @param {string} name - Feature flag name
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFeatureFlag = async (name) => {
  try {
    await databaseService.initialize();
    
    await databaseService.delete(
      'feature_flags',
      'name = ?',
      [name]
    );
    
    return true;
  } catch (error) {
    if (__DEV__) console.error(`Error deleting feature flag '${name}':`, error);
    throw error;
  }
};
