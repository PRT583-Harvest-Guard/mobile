/**
 * Database Service
 * Handles database operations for the Harvest Guard application
 * 
 * This implementation uses SQLite via expo-sqlite to interact with the mobile database
 */
import * as SQLite from 'expo-sqlite';
import config from '../config/env';

class DatabaseService {
  constructor() {
    this.initialized = false;
    this.db = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing SQLite database...');
      this.db = await SQLite.openDatabaseAsync(config.db.name);

      // Create tables if they don't exist
      await this.createTables();

      // Run migrations
      await this.runMigrations();

      this.initialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   * @returns {Promise<void>}
   */
  async runMigrations() {
    try {
      console.log('Running database migrations...');

      // Check if user_id column exists in farms table
      const farmsTableInfo = await this.db.getAllAsync("PRAGMA table_info(farms)");
      const userIdColumnExists = farmsTableInfo.some(column => column.name === 'user_id');

      if (!userIdColumnExists) {
        console.log('Adding user_id column to farms table...');

        // Add user_id column to farms table
        await this.db.execAsync(`
          ALTER TABLE farms ADD COLUMN user_id INTEGER;
        `);

        // Set default user_id to 1 for existing farms
        await this.db.execAsync(`
          UPDATE farms SET user_id = 1 WHERE user_id IS NULL;
        `);

        console.log('Migration completed: Added user_id column to farms table');
      } else {
        console.log('user_id column already exists in farms table');
      }

      // Check if photo_uri column exists in boundary_points table
      const boundaryPointsTableInfo = await this.db.getAllAsync("PRAGMA table_info(boundary_points)");
      const photoUriColumnExists = boundaryPointsTableInfo.some(column => column.name === 'photo_uri');

      if (!photoUriColumnExists) {
        console.log('Adding photo_uri column to boundary_points table...');

        // Add photo_uri column to boundary_points table
        await this.db.execAsync(`
          ALTER TABLE boundary_points ADD COLUMN photo_uri TEXT;
        `);

        console.log('Migration completed: Added photo_uri column to boundary_points table');
      } else {
        console.log('photo_uri column already exists in boundary_points table');
      }
    } catch (error) {
      console.error('Database migration error:', error);
      // Don't throw the error, just log it
      console.log('Will continue without running migrations');
    }
  }

  /**
   * Create database tables if they don't exist
   * @returns {Promise<void>}
   */
  async createTables() {
    try {
      // Create users table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          email TEXT,
          password_hash TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sessions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          token TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create farms table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS farms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          size REAL,
          plant_type TEXT,
          user_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create boundary_points table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS boundary_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER,
          latitude REAL,
          longitude REAL,
          timestamp TEXT,
          description TEXT,
          photo_uri TEXT,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        )
      `);

      // await this.db.execAsync(`
      //   DROP TABLE IF EXISTS observation_points;
      // `);

      // Create observation_points table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS observation_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER,
          latitude REAL,
          longitude REAL,
          observation_status TEXT,
          name TEXT,
          segment INTEGER,
          inspection_suggestion_id INTEGER,
          confidence_level TEXT,
          target_entity TEXT,
          observation_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        )
      `);

      // Create inspection_suggestions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS inspection_suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_entity TEXT NOT NULL,
          confidence_level TEXT NOT NULL,
          property_location INTEGER,
          area_size REAL NOT NULL,
          density_of_plant INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (property_location) REFERENCES farms(id) ON DELETE CASCADE
        )
      `);

      // Create inspection_observations table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS inspection_observations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          inspection_id INTEGER,
          confidence TEXT NOT NULL,
          section_id INTEGER,
          farm_id INTEGER,
          plant_per_section TEXT,
          status TEXT NOT NULL,
          target_entity TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        )
      `);

      // Create feature_flags table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS feature_flags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          enabled INTEGER DEFAULT 0,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default feature flags if they don't exist
      await this.db.execAsync(`
        INSERT OR IGNORE INTO feature_flags (name, enabled, description)
        VALUES ('delete_farm', 0, 'Allow farmers to delete their farms and all associated data')
      `);

      // await this.db.execAsync(`
      //   DROP TABLE IF EXISTS observations;
      // `);

      await this.db.execAsync(`
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

    await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS InspectionObservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          inspection_id INTEGER,
          confidence TEXT NOT NULL,
          section_id INTEGER,
          farm_id INTEGER,
          user_id INTEGER,
          plant_per_section TEXT,
          status TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating database tables:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(sql, params = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize database before query:', error);
        throw error;
      }
    }

    try {
      return await this.db.execAsync(sql, params);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Insert a record into a table
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {Promise<number>} Inserted ID
   */
  async insert(table, data) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Build the SQL query
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

      const result = await this.db.runAsync(sql, values);
      return result.lastInsertRowId;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  /**
   * Update a record in a table
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {string} whereClause - WHERE clause
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<number>} Number of rows affected
   */
  async update(table, data, whereClause, whereParams = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Build the SQL query
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), ...whereParams];

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

      const result = await this.db.runAsync(sql, values);
      return result.rowsAffected;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record from a table
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE clause
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<number>} Number of rows affected
   */
  async delete(table, whereClause, whereParams = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

      const result = await this.db.runAsync(sql, whereParams);
      return result.rowsAffected;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Query records from a table
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.db.getAllAsync(sql, params);
    } catch (error) {
      console.error('Error querying database:', error);
      throw error;
    }
  }

  /**
   * Get a record by ID
   * @param {string} table - Table name
   * @param {string} idField - ID field name
   * @param {number} id - ID value
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async getById(table, idField, id) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const results = await this.db.getAllAsync(
        `SELECT * FROM ${table} WHERE ${idField} = ?`,
        [id]
      );

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting ${table} by ID:`, error);
      throw error;
    }
  }

  /**
   * Get all records from a table
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE clause
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<Array>} Records
   */
  async getAll(table, whereClause = '', whereParams = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let sql = `SELECT * FROM ${table}`;

      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      return await this.db.getAllAsync(sql, whereParams);
    } catch (error) {
      console.error(`Error getting all from ${table}:`, error);

      // If the table doesn't exist yet, return an empty array
      if (error.message && error.message.includes('no such table')) {
        console.warn(`Table ${table} does not exist yet, returning empty array`);
        return [];
      }

      throw error;
    }
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService;
