/**
 * Authentication Service
 * Handles user authentication operations
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import bcrypt from '@/utils/bcryptSetup';
import * as Crypto from 'expo-crypto';
import config from '@/config/env';

// Initialize database
let db = null;

const initDatabase = async () => {
  if (db !== null) {
    return db;
  }

  // Initialize SQLite database
  db = await SQLite.openDatabaseAsync(config.db.name);

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
   * Sign up a new user with the API
   * @param {Object} userData - User data for sign up
   * @param {string} userData.username - Username (used as phone_number)
   * @param {string} userData.email - Email
   * @param {string} userData.mobile - Mobile
   * @param {string} userData.password - Password
   * @returns {Promise<Object>} The API response
   */
  static async signUpWithApi(userData) {
    try {
      // API base URL - replace with your actual Django API URL in production
      const API_BASE_URL = config.api.baseUrl; // This works for Android emulator
      const SIGNUP_ENDPOINT = config.api.endpoints.register;

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Attempting to sign up with API:', `${API_BASE_URL}${SIGNUP_ENDPOINT}`);
      }

      // The Django API expects phone_number, email, name, password, and password_confirm
      const response = await fetch(`${API_BASE_URL}${SIGNUP_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone_number: userData.mobile, // Using username as phone_number
          email: userData.email,
          name: userData.username, // Use name if provided, otherwise use username
          password: userData.password,
          password_confirm: userData.password
        }),
      });

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign up response status:', response.status);
      }

      // Get the response text first to see what's coming back
      const responseText = await response.text();

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign up response text:', responseText);
      }

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('Error parsing response JSON:', parseError);
        }
      }

      if (!response.ok) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign up failed with status:', response.status);
          console.log('Response data:', data);
        }

        // Try to extract error details
        if (data.detail) {
          throw new Error(data.detail);
        } else if (data.non_field_errors) {
          throw new Error(data.non_field_errors.join(', '));
        } else if (data.phone_number) {
          throw new Error(`Phone number: ${data.phone_number.join(', ')}`);
        } else if (data.email) {
          throw new Error(`Email: ${data.email.join(', ')}`);
        } else if (data.password) {
          throw new Error(`Password: ${data.password.join(', ')}`);
        } else if (data.password_confirm) {
          throw new Error(`Password confirmation: ${data.password_confirm.join(', ')}`);
        } else {
          throw new Error(`API sign up failed with status ${response.status}`);
        }
      }

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign up successful');
      }

      return data;
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign up error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Sign in a user with the API
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username (used as phone_number)
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} The API response with tokens and user info
   */
  static async signInWithApi(credentials) {
    try {
      // API base URL - replace with your actual Django API URL in production
      const API_BASE_URL = config.api.baseUrl; // This works for Android emulator
      const LOGIN_ENDPOINT = config.api.endpoints.login;

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Attempting to sign in with API:', `${API_BASE_URL}${LOGIN_ENDPOINT}`);
      }

      // Get device info
      const deviceInfo = Platform.OS === 'ios'
        ? `iOS ${Platform.Version}`
        : `Android ${Platform.Version}`;

      // The Django API expects phone_number, password, and optional device_info
      const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone_number: credentials.username, // Using username as phone_number
          password: credentials.password,
          device_info: deviceInfo
        }),
      });

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign in response status:', response.status);
      }

      // Get the response text first to see what's coming back
      const responseText = await response.text();

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign in response text:', responseText);
      }

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.error('Error parsing response JSON:', parseError);
        }
      }

      if (!response.ok) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign in failed with status:', response.status);
          console.log('Response data:', data);
        }

        // Try to extract error details
        if (data.detail) {
          throw new Error(data.detail);
        } else if (data.non_field_errors) {
          throw new Error(data.non_field_errors.join(', '));
        } else if (data.phone_number) {
          throw new Error(`Phone number: ${data.phone_number.join(', ')}`);
        } else if (data.password) {
          throw new Error(`Password: ${data.password.join(', ')}`);
        } else {
          throw new Error(`API sign in failed with status ${response.status}`);
        }
      }

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign in successful');
      }

      return data;
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign in error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Sign out a user from the API
   * @param {string} refreshToken - The refresh token to invalidate
   * @returns {Promise<Object>} The API response
   */
  static async signOutWithApi(refreshToken) {
    try {
      // API base URL - replace with your actual Django API URL in production
      const API_BASE_URL = config.api.baseUrl; // This works for Android emulator
      const LOGOUT_ENDPOINT = config.api.endpoints.logout;

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Attempting to sign out with API:', `${API_BASE_URL}${LOGOUT_ENDPOINT}`);
      }

      // The Django API expects refresh_token
      const response = await fetch(`${API_BASE_URL}${LOGOUT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign out response status:', response.status);
      }

      // Get the response text first to see what's coming back
      const responseText = await response.text();

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign out response text:', responseText);
      }

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('Error parsing response JSON:', parseError);
        }
      }

      if (!response.ok) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign out failed with status:', response.status);
          console.log('Response data:', data);
        }

        // Try to extract error details
        if (data.detail) {
          throw new Error(data.detail);
        } else {
          throw new Error(`API sign out failed with status ${response.status}`);
        }
      }

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign out successful');
      }

      return data;
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('API sign out error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} The API response with new tokens
   */
  static async refreshTokenWithApi(refreshToken) {
    try {
      // API base URL - replace with your actual Django API URL in production
      const API_BASE_URL = config.api.baseUrl; // This works for Android emulator
      const REFRESH_ENDPOINT = config.api.endpoints.tokenRefresh;

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Attempting to refresh token with API:', `${API_BASE_URL}${REFRESH_ENDPOINT}`);
      }

      // The Django API expects refresh_token
      const response = await fetch(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        }),
      });

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API token refresh response status:', response.status);
      }

      // Get the response text first to see what's coming back
      const responseText = await response.text();

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API token refresh response text:', responseText);
      }

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('Error parsing response JSON:', parseError);
        }
      }

      if (!response.ok) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API token refresh failed with status:', response.status);
          console.log('Response data:', data);
        }

        // Try to extract error details
        if (data.detail) {
          throw new Error(data.detail);
        } else {
          throw new Error(`API token refresh failed with status ${response.status}`);
        }
      }

      // Only log in development, not in production
      if (__DEV__) {
        console.log('API token refresh successful');
      }

      return data;
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('API token refresh error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Sign up a new user
   * @param {Object} userData - User data for sign up
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.mobile - Mobile
   * @param {string} userData.password - Password
   * @returns {Promise<User>} The created user
   */
  static async signUp(userData) {
    try {
      // First try to sign up with the API
      try {
        await this.signUpWithApi(userData);
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign up successful, now signing up locally');
        }
      } catch (apiError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign up failed, aborting local sign up:', apiError.message);
        }
        throw apiError; // Re-throw the API error to stop the process
      }

      // If API sign up was successful, proceed with local sign up
      const database = await this.getDatabase();

      // Check if username already exists
      const existingUser = await this.findUserByUsername(userData.username);
      if (existingUser) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('User already exists locally, skipping local sign up');
        }
        return true;
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

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Local sign up successful');
      }
      return true;
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('Sign up error:', error.message);
      }
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
      // First try to sign in with the API
      try {
        const apiResponse = await this.signInWithApi(credentials);

        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign in successful');
        }

        // Store the tokens in secure storage
        // This would typically be done in ApiSyncService, but we'll do it here for completeness
        if (apiResponse.access_token && apiResponse.refresh_token) {
          // We'll assume there's a method to save tokens in ApiSyncService
          const ApiSyncService = require('@/services/ApiSyncService').default;
          await ApiSyncService.saveTokensToStorage(apiResponse.access_token, apiResponse.refresh_token);

          // Also save the user credentials for later use
          await ApiSyncService.saveCredentialsToStorage(credentials);
        }

        // Check if the user exists locally
        const database = await this.getDatabase();
        let user = await this.findUserByUsername(credentials.username);

        // If the user doesn't exist locally, create them
        if (!user) {
          // Only log in development, not in production
          if (__DEV__) {
            console.log('User does not exist locally, creating local user');
          }

          // Hash the password
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(credentials.password, salt);

          // Insert new user
          const result = await database.runAsync(
            'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
            credentials.username,
            hashedPassword,
            apiResponse.user?.email || `${credentials.username}@example.com`
          );

          // Get the newly created user
          user = await this.findUserByUsername(credentials.username);

          if (!user) {
            throw new Error('Failed to create local user');
          }
        }

        // Generate and store session token
        const sessionToken = await this.createSession(user.id);

        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            apiUser: apiResponse.user // Include the API user data
          },
          sessionToken,
          apiTokens: {
            accessToken: apiResponse.access_token,
            refreshToken: apiResponse.refresh_token
          }
        };
      } catch (apiError) {
        // Only log in development, not in production
        if (__DEV__) {
          console.log('API sign in failed, falling back to local sign in');
        }
        // Fall back to local sign in
      }

      // Local sign in
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
      // Only log in development, not in production
      if (__DEV__) {
        console.log('Sign in error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @param {string} sessionToken - The local session token
   * @param {string} refreshToken - The API refresh token (optional)
   * @returns {Promise<void>}
   */
  static async signOut(sessionToken, refreshToken) {
    try {
      // First try to sign out from the API if a refresh token is provided
      if (refreshToken) {
        try {
          await this.signOutWithApi(refreshToken);
          // Only log in development, not in production
          if (__DEV__) {
            console.log('API sign out successful');
          }

          // Clear the tokens from secure storage
          const ApiSyncService = require('@/services/ApiSyncService').default;
          await ApiSyncService.clearTokensFromStorage();
          await ApiSyncService.clearCredentialsFromStorage();
        } catch (apiError) {
          // Only log in development, not in production
          if (__DEV__) {
            console.log('API sign out failed:', apiError.message);
          }
          // Continue with local sign out even if API sign out fails
        }
      }

      // Local sign out
      const database = await this.getDatabase();
      await database.runAsync(
        'DELETE FROM sessions WHERE token = ?',
        sessionToken
      );

      // Only log in development, not in production
      if (__DEV__) {
        console.log('Local sign out successful');
      }
    } catch (error) {
      // Only log in development, not in production
      if (__DEV__) {
        console.log('Sign out error:', error.message);
      }
      throw error;
    }
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
