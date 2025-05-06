/**
 * Database Service
 * Handles database operations for the Harvest Guard application
 * 
 * This is a mock implementation that uses in-memory storage instead of SQLite
 * to avoid the "Cannot convert null value to object" error
 */

// In-memory storage for tables with realistic sample data
const inMemoryDb = {
  users: [
    {
      id: 1,
      username: 'farmer1',
      email: 'farmer1@example.com',
      password_hash: 'hashed_password',
      created_at: new Date().toISOString()
    }
  ],
  sessions: [],
  farms: [
    {
      id: 1,
      name: 'Green Valley Farm',
      size: 15.5,
      plant_type: 'Corn',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Sunset Orchards',
      size: 8.2,
      plant_type: 'Apples',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Riverside Plantation',
      size: 22.7,
      plant_type: 'Wheat',
      created_at: new Date().toISOString()
    }
  ],
  boundary_points: [
    // Green Valley Farm boundary points
    {
      id: 1,
      farm_id: 1,
      latitude: 34.0522,
      longitude: -118.2437,
      timestamp: new Date().toISOString(),
      description: 'North corner'
    },
    {
      id: 2,
      farm_id: 1,
      latitude: 34.0523,
      longitude: -118.2438,
      timestamp: new Date().toISOString(),
      description: 'East corner'
    },
    {
      id: 3,
      farm_id: 1,
      latitude: 34.0524,
      longitude: -118.2439,
      timestamp: new Date().toISOString(),
      description: 'South corner'
    },
    {
      id: 4,
      farm_id: 1,
      latitude: 34.0525,
      longitude: -118.2440,
      timestamp: new Date().toISOString(),
      description: 'West corner'
    },
    // Sunset Orchards boundary points
    {
      id: 5,
      farm_id: 2,
      latitude: 34.1522,
      longitude: -118.3437,
      timestamp: new Date().toISOString(),
      description: 'North corner'
    },
    {
      id: 6,
      farm_id: 2,
      latitude: 34.1523,
      longitude: -118.3438,
      timestamp: new Date().toISOString(),
      description: 'East corner'
    },
    {
      id: 7,
      farm_id: 2,
      latitude: 34.1524,
      longitude: -118.3439,
      timestamp: new Date().toISOString(),
      description: 'South corner'
    },
    // Riverside Plantation boundary points
    {
      id: 8,
      farm_id: 3,
      latitude: 34.2522,
      longitude: -118.4437,
      timestamp: new Date().toISOString(),
      description: 'North corner'
    },
    {
      id: 9,
      farm_id: 3,
      latitude: 34.2523,
      longitude: -118.4438,
      timestamp: new Date().toISOString(),
      description: 'East corner'
    },
    {
      id: 10,
      farm_id: 3,
      latitude: 34.2524,
      longitude: -118.4439,
      timestamp: new Date().toISOString(),
      description: 'South corner'
    }
  ],
  observation_points: [],
  inspection_suggestions: [
    {
      id: 1,
      target_entity: 'Corn Borer',
      confidence_level: '80%',
      property_location: 1, // Green Valley Farm
      area_size: 15.5,
      density_of_plant: 120,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      target_entity: 'Apple Maggot',
      confidence_level: '75%',
      property_location: 2, // Sunset Orchards
      area_size: 8.2,
      density_of_plant: 50,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      target_entity: 'Wheat Rust',
      confidence_level: '90%',
      property_location: 3, // Riverside Plantation
      area_size: 22.7,
      density_of_plant: 200,
      created_at: new Date().toISOString()
    }
  ],
  inspection_observations: [
    // Green Valley Farm observations
    {
      id: 1,
      date: new Date().toISOString(),
      inspection_id: 1, // Corn Borer suggestion
      confidence: '80%',
      section_id: 1, // North corner
      farm_id: 1, // Green Valley Farm
      plant_per_section: 'Corn',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Corn Borer'
    },
    {
      id: 2,
      date: new Date().toISOString(),
      inspection_id: 1, // Corn Borer suggestion
      confidence: '80%',
      section_id: 2, // East corner
      farm_id: 1, // Green Valley Farm
      plant_per_section: 'Corn',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Corn Borer'
    },
    {
      id: 3,
      date: new Date().toISOString(),
      inspection_id: 1, // Corn Borer suggestion
      confidence: '80%',
      section_id: 3, // South corner
      farm_id: 1, // Green Valley Farm
      plant_per_section: 'Corn',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Corn Borer'
    },
    {
      id: 4,
      date: new Date().toISOString(),
      inspection_id: 1, // Corn Borer suggestion
      confidence: '80%',
      section_id: 4, // West corner
      farm_id: 1, // Green Valley Farm
      plant_per_section: 'Corn',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Corn Borer'
    },
    // Sunset Orchards observations
    {
      id: 5,
      date: new Date().toISOString(),
      inspection_id: 2, // Apple Maggot suggestion
      confidence: '75%',
      section_id: 5, // North corner
      farm_id: 2, // Sunset Orchards
      plant_per_section: 'Apples',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Apple Maggot'
    },
    {
      id: 6,
      date: new Date().toISOString(),
      inspection_id: 2, // Apple Maggot suggestion
      confidence: '75%',
      section_id: 6, // East corner
      farm_id: 2, // Sunset Orchards
      plant_per_section: 'Apples',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Apple Maggot'
    },
    // Riverside Plantation observations
    {
      id: 7,
      date: new Date().toISOString(),
      inspection_id: 3, // Wheat Rust suggestion
      confidence: '90%',
      section_id: 8, // North corner
      farm_id: 3, // Riverside Plantation
      plant_per_section: 'Wheat',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Wheat Rust'
    },
    {
      id: 8,
      date: new Date().toISOString(),
      inspection_id: 3, // Wheat Rust suggestion
      confidence: '90%',
      section_id: 9, // East corner
      farm_id: 3, // Riverside Plantation
      plant_per_section: 'Wheat',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_entity: 'Wheat Rust'
    }
  ]
};

// Counter for generating IDs
let idCounter = 1;

class DatabaseService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing in-memory database...');
      // No actual initialization needed for in-memory database
      this.initialized = true;
      console.log('In-memory database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL-like query (mock implementation)
   * @param {string} sql - SQL-like query string (ignored in this mock)
   * @param {Array} params - Query parameters (ignored in this mock)
   * @returns {Promise<Object>} Mock query result
   */
  async executeQuery(sql, params = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize database before query:', error);
        return { rows: { length: 0, _array: [], item: () => null }, insertId: null, rowsAffected: 0 };
      }
    }
    
    // This is a mock implementation, so we don't actually execute SQL
    // Just return a mock result
    return {
      rows: {
        length: 0,
        _array: [],
        item: (index) => null
      },
      insertId: null,
      rowsAffected: 0
    };
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
    
    // Create a copy of the data with a new ID
    const newRecord = {
      ...data,
      id: idCounter++
    };
    
    // Add the record to the in-memory database
    if (!inMemoryDb[table]) {
      inMemoryDb[table] = [];
    }
    
    inMemoryDb[table].push(newRecord);
    
    return newRecord.id;
  }

  /**
   * Update a record in a table
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {string} whereClause - WHERE clause (ignored in this mock)
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<number>} Number of rows affected
   */
  async update(table, data, whereClause, whereParams = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In this mock implementation, we'll assume whereClause is always "id = ?"
    // and whereParams[0] is the ID
    const id = whereParams[0];
    
    // Find the record in the in-memory database
    if (!inMemoryDb[table]) {
      return 0;
    }
    
    const index = inMemoryDb[table].findIndex(record => record.id === id);
    
    if (index === -1) {
      return 0;
    }
    
    // Update the record
    inMemoryDb[table][index] = {
      ...inMemoryDb[table][index],
      ...data
    };
    
    return 1;
  }

  /**
   * Delete a record from a table
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE clause (ignored in this mock)
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<number>} Number of rows affected
   */
  async delete(table, whereClause, whereParams = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In this mock implementation, we'll assume whereClause is always "id = ?"
    // and whereParams[0] is the ID
    const id = whereParams[0];
    
    // Find the record in the in-memory database
    if (!inMemoryDb[table]) {
      return 0;
    }
    
    const initialLength = inMemoryDb[table].length;
    
    // Remove the record
    inMemoryDb[table] = inMemoryDb[table].filter(record => record.id !== id);
    
    return initialLength - inMemoryDb[table].length;
  }

  /**
   * Query records from a table
   * @param {string} sql - SQL query (ignored in this mock)
   * @param {Array} params - Query parameters (ignored in this mock)
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // This is a mock implementation, so we don't actually execute SQL
    // Just return an empty array
    return [];
  }

  /**
   * Get a record by ID
   * @param {string} table - Table name
   * @param {string} idField - ID field name (ignored in this mock)
   * @param {number} id - ID value
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async getById(table, idField, id) {
    // Make sure the database is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Find the record in the in-memory database
    if (!inMemoryDb[table]) {
      return null;
    }
    
    return inMemoryDb[table].find(record => record.id === id) || null;
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
    
    // Return all records from the in-memory database
    if (!inMemoryDb[table]) {
      inMemoryDb[table] = [];
    }
    
    // If no where clause, return all records
    if (!whereClause) {
      return [...inMemoryDb[table]];
    }
    
    // Simple implementation of WHERE clause for status filtering
    // This only supports "status = ?" type clauses
    if (whereClause.includes('status = ?') && whereParams.length > 0) {
      const status = whereParams[0];
      return inMemoryDb[table].filter(record => record.status === status);
    }
    
    // Default to returning all records
    return [...inMemoryDb[table]];
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService;
