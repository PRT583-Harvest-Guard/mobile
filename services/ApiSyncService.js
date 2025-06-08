/**
 * API Sync Service
 * Handles synchronization of local data with the Django API
 */
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/env';
import AuthService from './AuthService';
import databaseService from './DatabaseService';

// API base URL - replace with your actual Django API URL in production
// For development, use your computer's local network IP address
// For example: 'http://192.168.1.100:8001'
// Or use ngrok for testing: 'https://your-ngrok-url.ngrok.io'
// Config on .env file
const API_BASE_URL = config.api.baseUrl;

// API endpoints
const ENDPOINTS = config.api.endpoints;

// Secure storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_CREDENTIALS: "user_credentials",
  LAST_SYNC_TIME: "last_sync_time"
};

class ApiSyncService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;
    this.lastSyncStats = null;
    this.isInitialized = false;
    this.isOnline = true; // Assume online by default
  }

  /**
   * Initialize the API service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize the database service
      await databaseService.initialize();

      // Try to load tokens from storage
      await this.loadTokensFromStorage();

      this.isInitialized = true;
      console.log('API Sync Service initialized');
    } catch (error) {
      console.error('API Sync Service initialization error:', error);
      throw error;
    }
  }

  /**
   * Load tokens from storage
   * @returns {Promise<void>}
   */
  async loadTokensFromStorage() {
    try {
      // Try to get tokens from AsyncStorage first
      try {
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (accessToken && refreshToken) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          
          // Verify the access token
          const isValid = await this.verifyToken();
          
          if (!isValid) {
            // Try to refresh the token
            await this.refreshAccessToken();
          }
          
          return;
        }
      } catch (asyncError) {
        console.log('Error loading tokens from AsyncStorage:', asyncError);
      }
      
      // If AsyncStorage fails or tokens not found, try SecureStore as fallback
      try {
        this.accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        this.refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (this.accessToken && this.refreshToken) {
          // Verify the access token
          const isValid = await this.verifyToken();
          
          if (!isValid) {
            // Try to refresh the token
            await this.refreshAccessToken();
          }
        }
      } catch (secureError) {
        console.log('Error loading tokens from SecureStore:', secureError);
      }
    } catch (error) {
      console.error('Error loading tokens from storage:', error);
      // Clear tokens if there was an error
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Save tokens to storage
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<void>}
   */
  async saveTokensToStorage(accessToken, refreshToken) {
    try {
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      } catch (asyncError) {
        console.log('Error saving tokens to AsyncStorage:', asyncError);
      }
      
      // Also try to save to SecureStore as fallback
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      } catch (secureError) {
        console.log('Error saving tokens to SecureStore:', secureError);
      }
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
      // Don't throw the error, just log it
      console.log('Will continue without saving tokens to storage');
    }
  }

  /**
   * Clear tokens from storage
   * @returns {Promise<void>}
   */
  async clearTokensFromStorage() {
    try {
      // Clear from AsyncStorage
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } catch (asyncError) {
        console.log('Error clearing tokens from AsyncStorage:', asyncError);
      }
      
      // Also try to clear from SecureStore
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      } catch (secureError) {
        console.log('Error clearing tokens from SecureStore:', secureError);
      }
      
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens from storage:', error);
      // Don't throw the error, just log it
      console.log('Will continue without clearing tokens from storage');
    }
  }

  /**
   * Save user credentials to storage
   * @param {Object} credentials - User credentials
   * @returns {Promise<void>}
   */
  async saveCredentialsToStorage(credentials) {
    try {
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
      } catch (asyncError) {
        console.log('Error saving credentials to AsyncStorage:', asyncError);
      }
      
      // Also try to save to SecureStore as fallback
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
      } catch (secureError) {
        console.log('Error saving credentials to SecureStore:', secureError);
      }
    } catch (error) {
      console.error('Error saving credentials to storage:', error);
      // Don't throw the error, just log it
      console.log('Will continue without saving credentials to storage');
    }
  }

  /**
   * Get stored credentials from storage
   * @returns {Promise<Object|null>} Credentials or null
   */
  async getStoredCredentials() {
    try {
      // Try to get credentials from AsyncStorage first
      try {
        const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
        
        if (credentialsJson) {
          return JSON.parse(credentialsJson);
        }
      } catch (asyncError) {
        console.log('Error getting credentials from AsyncStorage:', asyncError);
      }
      
      // If AsyncStorage fails or credentials not found, try SecureStore as fallback
      try {
        const credentialsJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER_CREDENTIALS);
        
        if (credentialsJson) {
          return JSON.parse(credentialsJson);
        }
      } catch (secureError) {
        console.log('Error getting credentials from SecureStore:', secureError);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting credentials from storage:', error);
      return null;
    }
  }

  /**
   * Clear credentials from storage
   * @returns {Promise<void>}
   */
  async clearCredentialsFromStorage() {
    try {
      // Clear from AsyncStorage
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_CREDENTIALS);
      } catch (asyncError) {
        console.log('Error clearing credentials from AsyncStorage:', asyncError);
      }
      
      // Also try to clear from SecureStore
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_CREDENTIALS);
      } catch (secureError) {
        console.log('Error clearing credentials from SecureStore:', secureError);
      }
    } catch (error) {
      console.error('Error clearing credentials from storage:', error);
      // Don't throw the error, just log it
      console.log('Will continue without clearing credentials from storage');
    }
  }

  /**
   * Save the last sync time
   * @returns {Promise<void>}
   */
  async saveLastSyncTime() {
    try {
      const now = new Date().toISOString();
      
      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, now);
      } catch (asyncError) {
        console.log('Error saving last sync time to AsyncStorage:', asyncError);
      }
      
      // Also try to save to SecureStore as fallback
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.LAST_SYNC_TIME, now);
      } catch (secureError) {
        console.log('Error saving last sync time to SecureStore:', secureError);
      }
    } catch (error) {
      console.error('Error saving last sync time:', error);
      // Don't throw the error, just log it
      console.log('Will continue without saving last sync time');
    }
  }

  /**
   * Get the last sync time
   * @returns {Promise<string|null>} Last sync time or null
   */
  async getLastSyncTime() {
    try {
      // Try to get last sync time from AsyncStorage first
      try {
        const lastSyncTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
        
        if (lastSyncTime) {
          return lastSyncTime;
        }
      } catch (asyncError) {
        console.log('Error getting last sync time from AsyncStorage:', asyncError);
      }
      
      // If AsyncStorage fails or last sync time not found, try SecureStore as fallback
      try {
        const lastSyncTime = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_SYNC_TIME);
        
        if (lastSyncTime) {
          return lastSyncTime;
        }
      } catch (secureError) {
        console.log('Error getting last sync time from SecureStore:', secureError);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Get the last sync stats
   * @returns {Object|null} Last sync stats or null
   */
  getLastSyncStats() {
    return this.lastSyncStats;
  }

  /**
   * Verify the access token
   * @returns {Promise<boolean>} Whether the token is valid
   */
  async verifyToken() {
    if (!this.accessToken) {
      console.log('No access token to verify');
      return false;
    }

    try {
      console.log('Attempting to verify token with:', `${API_BASE_URL}${ENDPOINTS.userInfo}`);

      // Instead of using a dedicated token verification endpoint, we'll try to get the user info
      // If the token is valid, this should succeed
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.userInfo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `JWT ${this.accessToken}`,
        },
      });

      console.log('Token verification response status:', response.status);

      // Get the response text first to see what's coming back
      const responseText = await response.text();
      console.log('Token verification response text:', responseText);

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Error parsing token verification response JSON:', parseError);
      }

      if (!response.ok) {
        console.error('Token verification failed with status:', response.status);
        console.error('Response data:', data);
        return false;
      }

      console.log('Token verification successful');
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Refresh the access token
   * @returns {Promise<boolean>} Whether the token was refreshed successfully
   */
  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    try {
      console.log('Attempting to refresh token with:', `${API_BASE_URL}${ENDPOINTS.tokenRefresh}`);

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.tokenRefresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      console.log('Token refresh response status:', response.status);

      // Get the response text first to see what's coming back
      const responseText = await response.text();
      console.log('Token refresh response text:', responseText);

      // Try to parse as JSON if possible
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Error parsing refresh token response JSON:', parseError);
        throw new Error('Failed to parse refresh token response');
      }

      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status);
        console.error('Response data:', data);
        throw new Error(data.detail || 'Failed to refresh token');
      }

      if (!data.access_token) {
        console.error('Token refresh response missing access token:', data);
        throw new Error('Refresh token response missing access token');
      }

      console.log('Token refresh successful, new access token received');

      // Save the new access token and refresh token (if provided)
      const newRefreshToken = data.refresh_token || this.refreshToken;
      await this.saveTokensToStorage(data.access_token, newRefreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);

      // Clear tokens if refresh failed
      await this.clearTokensFromStorage();

      return false;
    }
  }

  /**
   * Authenticate with the Django API
   * @param {Object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(credentials) {
    try {
      // Check if we're online
      if (!this.isOnline) {
        // Try to authenticate locally
        const localAuth = await AuthService.signIn(credentials);

        if (localAuth) {
          // Save credentials for later API authentication
          await this.saveCredentialsToStorage(credentials);

          return {
            success: true,
            message: 'Authenticated locally (offline mode)',
            user: localAuth.user,
          };
        }

        throw new Error('Local authentication failed');
      }

      // Get device info
      const deviceInfo = Platform.OS === 'ios'
        ? `iOS ${Platform.Version}`
        : `Android ${Platform.Version}`;

      // Online authentication with the API
      console.log('Attempting to authenticate with API:', `${API_BASE_URL}${ENDPOINTS.login}`);
      console.log('Credentials:', JSON.stringify({
        phone_number: credentials.username, // Using username as phone_number
        password: '********', // Masked for security
        device_info: deviceInfo
      }));

      // The Django API expects phone_number instead of username
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.login}`, {
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

      console.log('Authentication response status:', response.status);

      // Get the response text first to see what's coming back
      const responseText = await response.text();
      console.log('Authentication response text:', responseText);

      // Try to parse as JSON if possible
      let errorData = {};
      let data = {};

      try {
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
      }

      if (!response.ok) {
        console.error('Authentication failed with status:', response.status);
        console.error('Response data:', data);

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
          throw new Error(`Authentication failed with status ${response.status}`);
        }
      }

      // If we got here, the response was OK
      console.log('Authentication successful, tokens received');

      // Save tokens
      await this.saveTokensToStorage(data.access_token, data.refresh_token);

      // Save credentials for later use
      await this.saveCredentialsToStorage(credentials);

      // Try to authenticate locally as well
      try {
        await AuthService.signIn(credentials);
      } catch (localAuthError) {
        // If local auth fails, try to create the user locally
        try {
          await AuthService.signUp({
            username: credentials.username,
            password: credentials.password,
            email: data.user?.email || `${credentials.username}@example.com`,
            name: data.user?.name || credentials.username
          });

          // Try to sign in again
          await AuthService.signIn(credentials);
        } catch (localSignUpError) {
          console.error('Local sign up error:', localSignUpError);
          // Continue anyway, since API auth succeeded
        }
      }

      return {
        success: true,
        message: 'Authenticated with API',
        tokens: {
          access: data.access_token,
          refresh: data.refresh_token,
        },
        user: data.user
      };
    } catch (error) {
      console.error('API authentication error:', error);

      // If API auth fails, try local auth as fallback
      try {
        const localAuth = await AuthService.signIn(credentials);

        if (localAuth) {
          // Save credentials for later API authentication
          await this.saveCredentialsToStorage(credentials);

          return {
            success: true,
            message: 'Authenticated locally (API auth failed)',
            user: localAuth.user,
          };
        }
      } catch (localAuthError) {
        console.error('Local authentication error:', localAuthError);
      }

      throw error;
    }
  }

  /**
   * Sign out
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      // Get the refresh token before clearing it
      const refreshToken = this.refreshToken;
      
      // Clear tokens
      await this.clearTokensFromStorage();

      // Clear credentials
      await this.clearCredentialsFromStorage();

      // Sign out locally
      const credentials = await this.getStoredCredentials();
      if (credentials) {
        await AuthService.signOut(credentials.sessionToken, refreshToken);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Check if the user is authenticated
   * @param {boolean} skipTokenVerification - Whether to skip token verification (to prevent infinite loops)
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  async isAuthenticated(skipTokenVerification = false) {
    // Check if we have tokens
    if (this.accessToken && this.refreshToken) {
      // If we're skipping token verification, just return true
      if (skipTokenVerification) {
        return true;
      }

      // Verify the access token only once
      const isValid = await this.verifyToken();

      if (isValid) {
        return true;
      }

      // Try to refresh the token only once
      return await this.refreshAccessToken();
    }

    // Check if we have stored credentials
    const credentials = await this.getStoredCredentials();

    if (credentials) {
      // If we're skipping token verification, just return true
      if (skipTokenVerification) {
        return true;
      }

      // Try to authenticate with the stored credentials only once
      try {
        await this.authenticate(credentials);
        return true;
      } catch (error) {
        console.error('Authentication with stored credentials failed:', error);
      }
    }

    return false;
  }

  /**
   * Set the online status
   * @param {boolean} isOnline - Whether the app is online
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
  }

  /**
   * Check if the API is reachable
   * @returns {Promise<boolean>} Whether the API is reachable
   */
  async isApiReachable() {
    try {
      console.log('Checking if API is reachable:', API_BASE_URL);

      // Try to make a simple request to the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Try a few different endpoints to see if any of them are reachable
      let response;

      try {
        // First try the root URL
        response = await fetch(`${API_BASE_URL}`, {
          method: 'GET',
          signal: controller.signal
        });

        console.log('API root URL response status:', response.status);

        if (response.status !== 0) {
          clearTimeout(timeoutId);
          return true;
        }
      } catch (rootError) {
        console.error('Error checking API root URL:', rootError);
      }

      try {
        // Then try the accounts endpoint
        response = await fetch(`${API_BASE_URL}/api/accounts/`, {
          method: 'GET',
          signal: controller.signal
        });

        console.log('API accounts endpoint response status:', response.status);

        if (response.status !== 0) {
          clearTimeout(timeoutId);
          return true;
        }
      } catch (accountsError) {
        console.error('Error checking API accounts endpoint:', accountsError);
      }

      try {
        // Finally try the JWT verify endpoint
        response = await fetch(`${API_BASE_URL}${ENDPOINTS.jwtVerify}`, {
          method: 'GET',
          signal: controller.signal
        });

        console.log('API JWT verify endpoint response status:', response.status);

        clearTimeout(timeoutId);

        // Even if we get a 405 Method Not Allowed, it means the server is reachable
        return response.status !== 0;
      } catch (jwtError) {
        console.error('Error checking API JWT verify endpoint:', jwtError);
      }

      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      console.error('API reachability check error:', error);
      return false;
    }
  }

  /**
   * Perform a full sync with the Django API
   * Thijust s method is used by the sync-records.jsx page
   * @returns {Promise<Object>} Sync result
   */
  async performFullSync() {
    try {
      // Initialize the service
      await this.initialize();

      // Check if we're online
      if (!this.isOnline) {
        throw new Error('Cannot sync while offline');
      }

      // Check if we're authenticated, but skip token verification to prevent continuous token refresh
      const isAuth = await this.isAuthenticated(true);

      if (!isAuth) {
        // We need to re-authenticate
        const credentials = await this.getStoredCredentials();

        if (credentials) {
          const authResult = await this.authenticate(credentials);
          if (!authResult.success) {
            // Authentication failed, return a special error object
            return { authRequired: true, message: 'Authentication failed' };
          }
        } else {
          // No credentials, return a special error object
          return { authRequired: true, message: 'Authentication required' };
        }
      }

      // Mock sync result for now
      const result = {
        success: true,
        results: {
          farms: { created: 0, updated: 0, deleted: 0 },
          boundary_points: { created: 0, updated: 0, deleted: 0 },
          observation_points: { created: 0, updated: 0, deleted: 0 },
          inspection_suggestions: { created: 0, updated: 0, deleted: 0 },
          inspection_observations: { created: 0, updated: 0, deleted: 0 }
        }
      };

      // Store the sync stats
      this.lastSyncStats = {
        farms: result.results?.farms?.created || 0,
        boundaryPoints: result.results?.boundary_points?.created || 0,
        observationPoints: result.results?.observation_points?.created || 0,
        inspectionSuggestions: result.results?.inspection_suggestions?.created || 0,
        inspectionObservations: result.results?.inspection_observations?.created || 0,
        timestamp: new Date().toISOString(),
      };

      // Save the last sync time
      await this.saveLastSyncTime();

      console.log('Sync stats:', this.lastSyncStats);
      console.log('Sync completed successfully:', result);

      return result;
    } catch (error) {
      console.error('Full sync error:', error);

      // If the error is due to authentication, return a special error object
      if (error.message.includes('Not authenticated') ||
        error.message.includes('Authentication failed') ||
        error.message.includes('401')) {
        return { authRequired: true, message: 'Authentication required' };
      }

      // For other errors, still throw them
      Alert.alert('Sync Error', error.message);
      throw error;
    }
  }

  /**
   * Prepare farms for sync
   * @returns {Promise<Array>} Farms to sync
   */
  async prepareFarmsForSync() {
    return [];
  }

  /**
   * Prepare boundary points for sync
   * @returns {Promise<Array>} Boundary points to sync
   */
  async prepareBoundaryPointsForSync() {
    return [];
  }

  /**
   * Prepare observation points for sync
   * @returns {Promise<Array>} Observation points to sync
   */
  async prepareObservationPointsForSync() {
    return [];
  }

  /**
   * Prepare inspection suggestions for sync
   * @returns {Promise<Array>} Inspection suggestions to sync
   */
  async prepareInspectionSuggestionsForSync() {
    return [];
  }

  /**
   * Prepare inspection observations for sync
   * @returns {Promise<Array>} Inspection observations to sync
   */
  async prepareInspectionObservationsForSync() {
    return [];
  }
}

// Create a singleton instance
const apiSyncService = new ApiSyncService();

export default apiSyncService;
