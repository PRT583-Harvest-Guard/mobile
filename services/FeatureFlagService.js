import * as SQLite from 'expo-sqlite';
import config from '@/config/env';

let db;

/**
 * Initialize the feature_flags table
 */
export const initFeatureFlagsTable = async () => {
  try {
    db = await SQLite.openDatabaseAsync(config.db.name);

    // Create feature_flags table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 0,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default feature flags if they don't exist
    await db.execAsync(`
      INSERT OR IGNORE INTO feature_flags (name, enabled, description)
      VALUES ('delete_farm', 0, 'Allow farmers to delete their farms and all associated data')
    `);

    console.log('Feature flags table initialized successfully');
  } catch (error) {
    console.error('Error initializing feature flags table:', error);
    throw error;
  }
};

/**
 * Get all feature flags
 * @returns {Promise<Array>} - Array of feature flags
 */
export const getFeatureFlags = async () => {
  if (!db) await initFeatureFlagsTable();

  try {
    const flags = await db.getAllAsync('SELECT * FROM feature_flags');
    return flags;
  } catch (error) {
    console.error('Error getting feature flags:', error);
    throw error;
  }
};

/**
 * Get a specific feature flag by name
 * @param {string} name - Feature flag name
 * @returns {Promise<Object|null>} - Feature flag or null if not found
 */
export const getFeatureFlag = async (name) => {
  if (!db) await initFeatureFlagsTable();

  try {
    const flags = await db.getAllAsync(
      'SELECT * FROM feature_flags WHERE name = ?',
      [name]
    );

    if (flags.length === 0) {
      return null;
    }

    return flags[0];
  } catch (error) {
    console.error(`Error getting feature flag '${name}':`, error);
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
    console.error(`Error checking if feature '${name}' is enabled:`, error);
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
  if (!db) await initFeatureFlagsTable();

  try {
    await db.runAsync(
      'UPDATE feature_flags SET enabled = ? WHERE name = ?',
      [enabled ? 1 : 0, name]
    );

    return true;
  } catch (error) {
    console.error(`Error updating feature flag '${name}':`, error);
    throw error;
  }
};
