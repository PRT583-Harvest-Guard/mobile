/**
 * Database Service
 * Handles SQLite database operations for the Harvest Guard application
 */
import { openDatabase } from 'react-native-sqlite-storage';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const db = openDatabase({ name: 'mobile.db' });

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
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Create users table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,
            [],
            () => console.log('Users table created successfully'),
            (_, error) => {
              console.error('Error creating users table:', error);
              reject(error);
            }
          );

          // Create sessions table
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS sessions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              token TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`,
            [],
            () => console.log('Sessions table created successfully'),
            (_, error) => {
              console.error('Error creating sessions table:', error);
              reject(error);
            }
          );
        }, (error) => {
          console.error('Transaction error:', error);
          reject(error);
        }, () => {
          console.log('Database initialization completed');
          this.initialized = true;
          resolve();
        });
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL statement
   * @param {string} sql - SQL statement
   * @param {Array} params - SQL parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Insert a record into a table
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {Promise<number>} Inserted ID
   */
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const result = await this.executeQuery(sql, values);
    return result.insertId;
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
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    const result = await this.executeQuery(sql, [...values, ...whereParams]);
    return result.rowsAffected;
  }

  /**
   * Delete a record from a table
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE clause
   * @param {Array} whereParams - WHERE parameters
   * @returns {Promise<number>} Number of rows affected
   */
  async delete(table, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const result = await this.executeQuery(sql, whereParams);
    return result.rowsAffected;
  }

  /**
   * Query records from a table
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    const result = await this.executeQuery(sql, params);
    return result.rows._array;
  }

  /**
   * Get a record by ID
   * @param {string} table - Table name
   * @param {string} idField - ID field name
   * @param {number} id - ID value
   * @returns {Promise<Object|null>} Record or null if not found
   */
  async getById(table, idField, id) {
    const sql = `SELECT * FROM ${table} WHERE ${idField} = ? LIMIT 1`;
    
    const result = await this.executeQuery(sql, [id]);
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  /**
   * Get all records from a table
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE clause (optional)
   * @param {Array} whereParams - WHERE parameters (optional)
   * @returns {Promise<Array>} Records
   */
  async getAll(table, whereClause = '', whereParams = []) {
    let sql = `SELECT * FROM ${table}`;
    
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }
    
    const result = await this.executeQuery(sql, whereParams);
    return result.rows._array;
  }
}

// Create a singleton instance
const databaseService = new DatabaseService();

export default databaseService; 