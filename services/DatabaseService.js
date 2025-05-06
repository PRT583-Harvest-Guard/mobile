/**
 * Database Service
 * Handles database operations for the Harvest Guard application
 * 
 * This is a mock implementation that uses in-memory storage instead of SQLite
 * to avoid the "Cannot convert null value to object" error
 */

// In-memory storage for tables
const inMemoryDb = {
  users: [],
  sessions: [],
  farms: [],
  boundary_points: [],
  observation_points: [],
  inspection_suggestions: [],
  inspection_observations: []
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
   * @param {string} whereClause - WHERE clause (ignored in this mock)
   * @param {Array} whereParams - WHERE parameters (ignored in this mock)
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
    
    return [...inMemoryDb[table]];
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService;
