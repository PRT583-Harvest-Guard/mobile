/**
 * Authentication Service
 * Handles user authentication operations
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import bcrypt from '@/utils/bcryptSetup';
import * as Crypto from 'expo-crypto';

// Initialize database
let db = null;

const initDatabase = async () => {
  if (db !== null) {
    return db;
  }

  // Initialize SQLite database
  db = await SQLite.openDatabaseAsync('mobile.db');
  
  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
};

class AuthService {
  static async getDatabase() {
    if (!db) {
      db = await initDatabase();
    }
    return db;
  }

  /**
   * Sign up a new user
   * @param {Object} userData - User data for sign up
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {string} userData.first_name - First name
   * @param {string} userData.last_name - Last name
   * @returns {Promise<User>} The created user
   */
  static async signUp(userData) {
    try {
      const database = await this.getDatabase();
      
      // Check if username already exists
      const existingUser = await this.findUserByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(userData.password, salt);

      // Insert new user
      const result = await database.runAsync(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        userData.username,
        hashedPassword,
        userData.email
      );

      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in a user
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username or email
   * @param {string} credentials.password - Password
   * @returns {Promise<User>} The authenticated user
   */
  static async signIn(credentials) {
    try {
      const database = await this.getDatabase();
      const user = await this.findUserByUsername(credentials.username);
      
      if (!user) {
        throw new Error('Invalid username or password');
      }

      const isValidPassword = bcrypt.compareSync(credentials.password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Generate and store session token
      const sessionToken = await this.createSession(user.id);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        sessionToken
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  static async signOut(sessionToken) {
    const database = await this.getDatabase();
    await database.runAsync(
      'DELETE FROM sessions WHERE token = ?',
      sessionToken
    );
  }

  static async findUserByUsername(username) {
    const database = await this.getDatabase();
    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE username = ?',
      username
    );
    return user || null;
  }

  static async createSession(userId) {
    const database = await this.getDatabase();
    // Generate a unique token using timestamp and UUID
    const timestamp = Date.now();
    const uuid = await Crypto.randomUUID();
    const token = `${timestamp}-${uuid}-${userId}`;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    await database.runAsync(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      userId,
      token,
      expiresAt.toISOString()
    );

    return token;
  }
}

export default AuthService;
