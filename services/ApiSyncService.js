/**
 * API Sync Service
 * Handles synchronization of local data with the Django API
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AuthService from './AuthService';
import databaseService from './DatabaseService';
import { Alert } from 'react-native';

// API base URL - replace with your actual Django API URL in production
// For development, use your computer's local network IP address
// For example: 'http://192.168.1.100:8001'
// Or use ngrok for testing: 'https://your-ngrok-url.ngrok.io'
const API_BASE_URL = 'http://192.168.0.61:8001'; // This works for Android emulator
// const API_BASE_URL = 'http://localhost:8001'; // This works for iOS simulator
// const API_BASE_URL = 'http://0.0.0.0:8001'; // This works for local development

// API endpoints
const ENDPOINTS = {
  // Authentication endpoints
  JWT_CREATE: '/api/accounts/jwt/create/',
  JWT_REFRESH: '/api/accounts/jwt/refresh/',
  JWT_VERIFY: '/api/accounts/jwt/verify/',
  
  // Data endpoints
  FARMS: '/api/farms/',
  BOUNDARY_POINTS: '/api/boundary-points/',
  OBSERVATION_POINTS: '/api/observation-points/',
  OBSERVATION_POINTS_SYNC: '/api/observation-points/sync/',
  OBSERVATION_POINTS_PENDING: '/api/observation-points/pending_sync/',
  INSPECTION_SUGGESTIONS: '/api/inspection-suggestions/',
  INSPECTION_SUGGESTIONS_SYNC: '/api/inspection-suggestions/sync/',
  INSPECTION_SUGGESTIONS_PENDING: '/api/inspection-suggestions/pending_sync/',
  INSPECTION_OBSERVATIONS: '/api/inspection-observations/',
  PROFILE: '/api/profile/profile/',
  PROFILE_SYNC: '/api/profile/profile/sync/',
  
  // Main sync endpoint
  SYNC_DATA: '/api/sync-data/',
};

// Secure storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'harvestguard_access_token',
  REFRESH_TOKEN: 'harvestguard_refresh_token',
  USER_CREDENTIALS: 'harvestguard_user_credentials',
  LAST_SYNC_TIME: 'harvestguard_last_sync_time',
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
      
      // Try to load tokens from secure storage
      await this.loadTokensFromStorage();
      
      this.isInitialized = true;
      console.log('API Sync Service initialized');
    } catch (error) {
      console.error('API Sync Service initialization error:', error);
      throw error;
    }
  }

  /**
   * Load tokens from secure storage
   * @returns {Promise<void>}
   */
  async loadTokensFromStorage() {
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
    } catch (error) {
      console.error('Error loading tokens from storage:', error);
      // Clear tokens if there was an error
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Save tokens to secure storage
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<void>}
   */
  async saveTokensToStorage(accessToken, refreshToken) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
      throw error;
    }
  }

  /**
   * Clear tokens from secure storage
   * @returns {Promise<void>}
   */
  async clearTokensFromStorage() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens from storage:', error);
      throw error;
    }
  }

  /**
   * Save user credentials to secure storage
   * @param {Object} credentials - User credentials
   * @returns {Promise<void>}
   */
  async saveCredentialsToStorage(credentials) {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER_CREDENTIALS,
        JSON.stringify(credentials)
      );
    } catch (error) {
      console.error('Error saving credentials to storage:', error);
      throw error;
    }
  }

  /**
   * Get stored credentials from secure storage
   * @returns {Promise<Object|null>} Credentials or null
   */
  async getStoredCredentials() {
    try {
      const credentialsJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER_CREDENTIALS);
      
      if (credentialsJson) {
        return JSON.parse(credentialsJson);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting credentials from storage:', error);
      return null;
    }
  }

  /**
   * Clear credentials from secure storage
   * @returns {Promise<void>}
   */
  async clearCredentialsFromStorage() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_CREDENTIALS);
    } catch (error) {
      console.error('Error clearing credentials from storage:', error);
      throw error;
    }
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
      console.log('Attempting to verify token with:', `${API_BASE_URL}${ENDPOINTS.JWT_VERIFY}`);
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.JWT_VERIFY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: this.accessToken }),
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
      console.log('Attempting to refresh token with:', `${API_BASE_URL}${ENDPOINTS.JWT_REFRESH}`);
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.JWT_REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
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
      
      if (!data.access) {
        console.error('Token refresh response missing access token:', data);
        throw new Error('Refresh token response missing access token');
      }
      
      console.log('Token refresh successful, new access token received');
      
      // Save the new access token
      await this.saveTokensToStorage(data.access, this.refreshToken);
      
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
      
      // Online authentication with the API
      console.log('Attempting to authenticate with API:', `${API_BASE_URL}${ENDPOINTS.JWT_CREATE}`);
      console.log('Credentials:', JSON.stringify({
        phone_number: credentials.username, // Using username as phone_number
        password: '********' // Masked for security
      }));
      
      // The Django API expects phone_number instead of username
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.JWT_CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone_number: credentials.username, // Using username as phone_number
          password: credentials.password
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
        } else {
          throw new Error(`Authentication failed with status ${response.status}`);
        }
      }
      
      // If we got here, the response was OK
      console.log('Authentication successful, tokens received');
      
      // Save tokens
      await this.saveTokensToStorage(data.access, data.refresh);
      
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
            email: credentials.email || `${credentials.username}@example.com`,
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
          access: data.access,
          refresh: data.refresh,
        },
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
      // Clear tokens
      await this.clearTokensFromStorage();
      
      // Clear credentials
      await this.clearCredentialsFromStorage();
      
      // Sign out locally
      const credentials = await this.getStoredCredentials();
      if (credentials) {
        await AuthService.signOut(credentials.sessionToken);
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
        response = await fetch(`${API_BASE_URL}${ENDPOINTS.JWT_VERIFY}`, {
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
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @param {boolean} skipTokenRefresh - Whether to skip token refresh (to prevent infinite loops)
   * @returns {Promise<Object>} Response data
   */
  async apiRequest(endpoint, method = 'GET', data = null, requiresAuth = true, skipTokenRefresh = false) {
    // Check if we're online
    if (!this.isOnline) {
      throw new Error('Cannot make API request while offline');
    }
    
    // Check if we need authentication
    if (requiresAuth && !skipTokenRefresh) {
      // Check if we have a valid token
      if (!this.accessToken) {
        // Try to authenticate
        const credentials = await this.getStoredCredentials();
        
        if (credentials) {
          await this.authenticate(credentials);
        } else {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Not authenticated' };
        }
      }
      
      // Only verify the token if we're not skipping token refresh
      // This is to prevent infinite loops of token verification and refresh
      if (!skipTokenRefresh) {
        // Verify the token, but don't do this in a loop
        const isValid = await this.verifyToken();
        
        if (!isValid) {
          // Try to refresh the token once
          const refreshed = await this.refreshAccessToken();
          
          if (!refreshed) {
            // Try to authenticate again
            const credentials = await this.getStoredCredentials();
            
            if (credentials) {
              await this.authenticate(credentials);
            } else {
              // Return a special error object that indicates authentication is required
              return { authRequired: true, message: 'Not authenticated' };
            }
          }
        }
      }
    }
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Add authentication header if required
      if (requiresAuth && this.accessToken) {
        options.headers['Authorization'] = `JWT ${this.accessToken}`; // Use JWT instead of Bearer as per Django SIMPLE_JWT config
      }
      
      // Add request body if needed
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      
      if (!response.ok) {
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Try to refresh the token
          const refreshed = await this.refreshAccessToken();
          
          if (refreshed) {
            // Retry the request with the new token
            return this.apiRequest(endpoint, method, data, requiresAuth);
          }
          
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication failed' };
        }
        
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || `API request failed: ${response.status}`);
        } catch (jsonError) {
          // If we can't parse the error as JSON, return a special error object
          return { authRequired: true, message: `API request failed: ${response.status}` };
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync all local data with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncAll() {
    // 1) ensure we’re ready & authenticated
    await this.initialize();
    if (!this.isOnline) throw new Error('Offline – cannot sync');
    const ok = await this.isAuthenticated(true);
    if (!ok) {
      const creds = await this.getStoredCredentials();
      if (creds) await this.authenticate(creds);
      else throw new Error('Not authenticated – please log in');
    }
  
    // 2) prepare each array with the exact keys the DRF view expects:
    const farms               = await this.prepareFarmsForSync();                // [{ id, name, plant_type, size }]
    const boundary_points     = (await this.prepareBoundaryPointsForSync()).map(bp => ({
      id:           bp.id,
      farm_id:      bp.farm,           // rename `farm` ➔ `farm_id`
      latitude:     bp.latitude,
      longitude:    bp.longitude,
      description:  bp.description || '',
      timestamp:    bp.timestamp,      // if you want to sync timestamps too
    }));
    const observation_points  = (await this.prepareObservationPointsForSync()).map(op => ({
      id:                  op.id,
      farm_id:             op.farm_id,
      latitude:            op.latitude,
      longitude:           op.longitude,
      observation_status:  op.observation_status,
      name:                op.name,
      segment:             op.segment,
      inspection_suggestion_id: op.inspection_suggestion_id,
      confidence_level:    op.confidence_level,
      target_entity:       op.target_entity,
    }));
    const inspection_suggestions = (await this.prepareInspectionSuggestionsForSync()).map(s => ({
      id:                s.id,
      target_entity:     s.target_entity,
      confidence_level:  s.confidence_level,
      property_location: s.property_location,
      area_size:         s.area_size,
      density_of_plant:  s.density_of_plant,
    }));
    const inspection_observations = (await this.prepareInspectionObservationsForSync()).map(o => ({
      id:                   o.id,
      date:                 o.date,
      inspection_suggestion_id: o.inspection,  // align with your DRF logic
      farm_id:              o.farm,
      plant_per_section:    o.plant_per_section,
      status:               o.status,
      target_entity:        o.target_entity,
      severity:             o.severity,
    }));
  
    const payload = {
      farms,
      boundary_points,
      observation_points,
      inspection_suggestions,
      inspection_observations,
    };
  
    console.log('🔄 Bulk-sync payload', payload);
  
    // 3) fire a single POST
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `JWT ${this.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      const text = await res.text();
      console.error('Sync failed:', res.status, text);
      
      // Check if the error is due to authentication
      if (res.status === 401) {
        // Return a special error object that indicates authentication is required
        return { authRequired: true, message: 'Authentication required' };
      }
      
      throw new Error(`Sync error ${res.status}`);
    }
  
    const data = await res.json();
    console.log('✅ Bulk-sync response', data);
  
    // 4) dispatch to your existing processors
    const r = data.results;
    if (r.farms)                await this.processFarmsSyncResponse(r.farms);
    if (r.boundary_points)      await this.processBoundaryPointsSyncResponse(r.boundary_points);
    if (r.observation_points)   await this.processObservationPointsSyncResponse(r.observation_points);
    if (r.inspection_suggestions)   await this.processInspectionSuggestionsSyncResponse(r.inspection_suggestions);
    if (r.inspection_observations)  await this.processInspectionObservationsSyncResponse(r.inspection_observations);
  
    // 5) save last‐sync timestamp
    await this.saveLastSyncTime();
  
    return data;
  }

  /**
   * Prepare farms for sync
   * @returns {Promise<Array>} Farms to sync
   */
  async prepareFarmsForSync() {
    try {
      // Get all farms from local database
      const localFarms = await databaseService.getAll('farms');
      
      // Format the farms according to the Django API's expectations
      const formattedFarms = localFarms.map(farm => {
        return {
          id: farm.id, // Mobile ID for tracking
          name: farm.name,
          plant_type: farm.plant_type,
          size: farm.size,
          // The user will be set on the server side based on the authenticated user
        };
      });
      
      console.log('Prepared farms for sync:', formattedFarms);
      return formattedFarms;
    } catch (error) {
      console.error('Error preparing farms for sync:', error);
      return [];
    }
  }

  /**
   * Prepare boundary points for sync
   * @returns {Promise<Array>} Boundary points to sync
   */
  async prepareBoundaryPointsForSync() {
    try {
      // Get all boundary points from local database
      const localBoundaryPoints = await databaseService.getAll('boundary_points');
      
      // Format the boundary points according to the Django API's expectations
      const formattedBoundaryPoints = localBoundaryPoints.map(point => {
        return {
          id: point.id, // Mobile ID for tracking
          farm: point.farm_id, // The farm ID that this boundary point belongs to
          latitude: point.latitude,
          longitude: point.longitude,
          description: point.description || ''
        };
      });
      
      console.log('Prepared boundary points for sync:', formattedBoundaryPoints);
      return formattedBoundaryPoints;
    } catch (error) {
      console.error('Error preparing boundary points for sync:', error);
      return [];
    }
  }

  /**
   * Prepare observation points for sync
   * @returns {Promise<Array>} Observation points to sync
   */
  async prepareObservationPointsForSync() {
    try {
      // Get all observation points from local database
      const localObservationPoints = await databaseService.getAll('observation_points');
      
      // Format the observation points according to the Django API's expectations
      const formattedObservationPoints = localObservationPoints.map(point => {
        return {
          id: point.id, // Mobile ID for tracking
          farm_id: point.farm_id,
          latitude: point.latitude,
          longitude: point.longitude,
          observation_status: point.observation_status || 'Nil',
          name: point.name || '',
          segment: point.segment || 0,
          inspection_suggestion_id: point.inspection_suggestion_id || null,
          confidence_level: point.confidence_level || null,
          target_entity: point.target_entity || null
        };
      });
      
      console.log('Prepared observation points for sync:', formattedObservationPoints);
      return formattedObservationPoints;
    } catch (error) {
      console.error('Error preparing observation points for sync:', error);
      return [];
    }
  }

  /**
   * Prepare inspection suggestions for sync
   * @returns {Promise<Array>} Inspection suggestions to sync
   */
  async prepareInspectionSuggestionsForSync() {
    try {
      // Get all inspection suggestions from local database
      // Note: The table name is 'InspectionSuggestions' with capital letters, not 'inspection_suggestions'
      const localInspectionSuggestions = await databaseService.getAll('InspectionSuggestions');
      
      console.log('Retrieved inspection suggestions from database:', localInspectionSuggestions);
      
      // Format the inspection suggestions according to the Django API's expectations
      const formattedInspectionSuggestions = localInspectionSuggestions.map(suggestion => {
        // Log the suggestion to see what's in it
        console.log('Raw inspection suggestion:', suggestion);
        
        // Use the property_location field directly from the raw data
        // This is already set in the database
        return {
          id: suggestion.id, // Mobile ID for tracking
          target_entity: suggestion.target_entity,
          confidence_level: suggestion.confidence_level,
          property_location: suggestion.property_location, // Use the property_location field directly
          area_size: suggestion.area_size || 0,
          density_of_plant: suggestion.density_of_plant || 0
          // The user will be set on the server side based on the authenticated user
        };
      });
      
      console.log('Prepared inspection suggestions for sync:', formattedInspectionSuggestions);
      return formattedInspectionSuggestions;
    } catch (error) {
      console.error('Error preparing inspection suggestions for sync:', error);
      return [];
    }
  }

  /**
   * Prepare inspection observations for sync
   * @returns {Promise<Array>} Inspection observations to sync
   */
  async prepareInspectionObservationsForSync() {
    try {
      // Get all inspection observations from local database
      const localInspectionObservations = await databaseService.getAll('inspection_observations');
      
      // Format the inspection observations according to the Django API's expectations
      const formattedInspectionObservations = localInspectionObservations.map(observation => {
        return {
          id: observation.id, // Mobile ID for tracking
          date: observation.date,
          inspection: observation.inspection_id, // Inspection suggestion ID
          confidence: observation.confidence || '',
          section: observation.section_id, // Boundary point ID
          farm: observation.farm_id, // Farm ID
          plant_per_section: observation.plant_per_section || '',
          status: observation.status || '',
          target_entity: observation.target_entity || '',
          severity: observation.severity || '',
          // The user will be set on the server side based on the authenticated user
        };
      });
      
      console.log('Prepared inspection observations for sync:', formattedInspectionObservations);
      return formattedInspectionObservations;
    } catch (error) {
      console.error('Error preparing inspection observations for sync:', error);
      return [];
    }
  }

  /**
   * Process the sync response
   * @param {Object} response - Sync response
   * @returns {Promise<void>}
   */
  async processSyncResponse(response) {
    // Process farms
    if (response.results && response.results.farms) {
      await this.processFarmsSyncResponse(response.results.farms);
    }
    
    // Process boundary points
    if (response.results && response.results.boundary_points) {
      await this.processBoundaryPointsSyncResponse(response.results.boundary_points);
    }
    
    // Process observation points
    if (response.results && response.results.observation_points) {
      await this.processObservationPointsSyncResponse(response.results.observation_points);
    }
    
    // Process inspection suggestions
    if (response.results && response.results.inspection_suggestions) {
      await this.processInspectionSuggestionsSyncResponse(response.results.inspection_suggestions);
    }
    
    // Process inspection observations
    if (response.results && response.results.inspection_observations) {
      await this.processInspectionObservationsSyncResponse(response.results.inspection_observations);
    }
  }

  /**
   * Process farms sync response
   * @param {Object} farmsResponse - Farms sync response
   * @returns {Promise<void>}
   */
  async processFarmsSyncResponse(farmsResponse) {
    // Update local farms based on the response
    // This is a placeholder - in a real app, you would update the local database
    console.log('Processing farms sync response:', farmsResponse);
  }

  /**
   * Process boundary points sync response
   * @param {Object} boundaryPointsResponse - Boundary points sync response
   * @returns {Promise<void>}
   */
  async processBoundaryPointsSyncResponse(boundaryPointsResponse) {
    // Update local boundary points based on the response
    // This is a placeholder - in a real app, you would update the local database
    console.log('Processing boundary points sync response:', boundaryPointsResponse);
  }

  /**
   * Process observation points sync response
   * @param {Object} observationPointsResponse - Observation points sync response
   * @returns {Promise<void>}
   */
  async processObservationPointsSyncResponse(observationPointsResponse) {
    // Update local observation points based on the response
    // This is a placeholder - in a real app, you would update the local database
    console.log('Processing observation points sync response:', observationPointsResponse);
  }

  /**
   * Process inspection suggestions sync response
   * @param {Object} inspectionSuggestionsResponse - Inspection suggestions sync response
   * @returns {Promise<void>}
   */
  async processInspectionSuggestionsSyncResponse(inspectionSuggestionsResponse) {
    // Update local inspection suggestions based on the response
    // This is a placeholder - in a real app, you would update the local database
    console.log('Processing inspection suggestions sync response:', inspectionSuggestionsResponse);
  }

  /**
   * Process inspection observations sync response
   * @param {Object} inspectionObservationsResponse - Inspection observations sync response
   * @returns {Promise<void>}
   */
  async processInspectionObservationsSyncResponse(inspectionObservationsResponse) {
    // Update local inspection observations based on the response
    // This is a placeholder - in a real app, you would update the local database
    console.log('Processing inspection observations sync response:', inspectionObservationsResponse);
  }

  /**
   * Save the last sync time
   * @returns {Promise<void>}
   */
  async saveLastSyncTime() {
    try {
      const now = new Date().toISOString();
      await SecureStore.setItemAsync(STORAGE_KEYS.LAST_SYNC_TIME, now);
    } catch (error) {
      console.error('Error saving last sync time:', error);
    }
  }

  /**
   * Get the last sync time
   * @returns {Promise<string|null>} Last sync time or null
   */
  async getLastSyncTime() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.LAST_SYNC_TIME);
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
   * Perform a full sync with the Django API
   * This method is used by the sync-records.jsx page
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
      
      // Perform the sync
      const result = await this.syncAll();
      
      // Store the sync stats
      this.lastSyncStats = {
        farms: result.results?.farms?.created || 0,
        boundaryPoints: result.results?.boundary_points?.created || 0,
        observationPoints: result.results?.observation_points?.created || 0,
        inspectionSuggestions: result.results?.inspection_suggestions?.created || 0,
        inspectionObservations: result.results?.inspection_observations?.created || 0,
        timestamp: new Date().toISOString(),
      };
      
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
   * Sync a specific data type
   * @param {string} dataType - Data type to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncDataType(dataType) {
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
          await this.authenticate(credentials);
        } else {
          throw new Error('Not authenticated. Please log in to sync data.');
        }
      }
      
      let result;
      
      switch (dataType) {
        case 'farms':
          result = await this.syncFarms();
          break;
        case 'boundary_points':
          result = await this.syncBoundaryPoints();
          break;
        case 'observation_points':
          result = await this.syncObservationPoints();
          break;
        case 'inspection_suggestions':
          result = await this.syncInspectionSuggestions();
          break;
        case 'inspection_observations':
          result = await this.syncInspectionObservations();
          break;
        case 'profile':
          result = await this.syncProfile();
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      console.log(`Sync of ${dataType} completed successfully:`, result);
      
      return result;
    } catch (error) {
      console.error(`Sync of ${dataType} error:`, error);
      
      // If the error is due to authentication, we need to prompt the user to log in
      if (error.message.includes('Not authenticated') || error.message.includes('Authentication failed')) {
        throw new Error('Authentication failed. Please log in to sync data.');
      }
      
      Alert.alert('Sync Error', error.message);
      throw error;
    }
  }

  /**
   * Sync farms
   * @returns {Promise<Object>} Sync result
   */
  async syncFarms() {
    try {
      const farms = await this.prepareFarmsForSync();
      
      // Log the request data
      console.log('Syncing farms with data:', { farms });
      
      // Make a direct fetch request to the farms sync endpoint
      // The Django API expects the data to be structured differently
      // Instead of sending an array of farms, we need to send the farm data directly
      // Let's try using the main sync endpoint instead
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        },
        body: JSON.stringify({
          farms: farms,
          boundary_points: [],
          observation_points: [],
          inspection_suggestions: [],
          inspection_observations: []
        })
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Farms sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Farms sync response data:', responseData);
      
      await this.processFarmsSyncResponse(responseData);
      return responseData;
    } catch (error) {
      console.error('Farms sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync boundary points
   * @returns {Promise<Object>} Sync result
   */
  async syncBoundaryPoints() {
    try {
      const boundaryPoints = await this.prepareBoundaryPointsForSync();
      
      // Log the request data
      console.log('Syncing boundary points with data:', { boundary_points: boundaryPoints });
      
      // Make a direct fetch request to the main sync endpoint
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        },
        body: JSON.stringify({
          farms: [],
          boundary_points: boundaryPoints,
          observation_points: [],
          inspection_suggestions: [],
          inspection_observations: []
        })
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Boundary points sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Boundary points sync response data:', responseData);
      
      await this.processBoundaryPointsSyncResponse(responseData);
      return responseData;
    } catch (error) {
      console.error('Boundary points sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync observation points
   * @returns {Promise<Object>} Sync result
   */
  async syncObservationPoints() {
    try {
      const observationPoints = await this.prepareObservationPointsForSync();
      
      // Log the request data
      console.log('Syncing observation points with data:', { observation_points: observationPoints });
      
      // Make a direct fetch request to the main sync endpoint
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        },
        body: JSON.stringify({
          farms: [],
          boundary_points: [],
          observation_points: observationPoints,
          inspection_suggestions: [],
          inspection_observations: []
        })
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Observation points sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Observation points sync response data:', responseData);
      
      await this.processObservationPointsSyncResponse(responseData);
      return responseData;
    } catch (error) {
      console.error('Observation points sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync inspection suggestions
   * @returns {Promise<Object>} Sync result
   */
  async syncInspectionSuggestions() {
    try {
      const inspectionSuggestions = await this.prepareInspectionSuggestionsForSync();
      
      // Log the request data
      console.log('Syncing inspection suggestions with data:', { inspection_suggestions: inspectionSuggestions });
      
      // Make a direct fetch request to the main sync endpoint
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        },
        body: JSON.stringify({
          farms: [],
          boundary_points: [],
          observation_points: [],
          inspection_suggestions: inspectionSuggestions,
          inspection_observations: []
        })
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Inspection suggestions sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Inspection suggestions sync response data:', responseData);
      
      await this.processInspectionSuggestionsSyncResponse(responseData);
      return responseData;
    } catch (error) {
      console.error('Inspection suggestions sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync inspection observations
   * @returns {Promise<Object>} Sync result
   */
  async syncInspectionObservations() {
    try {
      const inspectionObservations = await this.prepareInspectionObservationsForSync();
      
      // Log the request data
      console.log('Syncing inspection observations with data:', { inspection_observations: inspectionObservations });
      
      // Make a direct fetch request to the main sync endpoint
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        },
        body: JSON.stringify({
          farms: [],
          boundary_points: [],
          observation_points: [],
          inspection_suggestions: [],
          inspection_observations: inspectionObservations
        })
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.SYNC_DATA}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Inspection observations sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Inspection observations sync response data:', responseData);
      
      await this.processInspectionObservationsSyncResponse(responseData);
      return responseData;
    } catch (error) {
      console.error('Inspection observations sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Sync user profile
   * @returns {Promise<Object>} Sync result
   */
  async syncProfile() {
    try {
      // Make a direct fetch request to the profile sync endpoint
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${this.accessToken}`
        }
      };
      
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE_SYNC}`, options);
      
      if (!response.ok) {
        // Get the response text to see what's coming back
        const responseText = await response.text();
        console.error('Profile sync response error:', response.status, responseText);
        
        // Check if the error is due to authentication
        if (response.status === 401) {
          // Return a special error object that indicates authentication is required
          return { authRequired: true, message: 'Authentication required' };
        }
        
        throw new Error(`API request failed: ${response.status} - ${responseText}`);
      }
      
      const responseData = await response.json();
      console.log('Profile sync response data:', responseData);
      
      // Process the response
      // This is a placeholder - in a real app, you would update the local database
      console.log('Processing profile sync response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('Profile sync error:', error);
      
      // If the error is related to authentication, return a special error object
      if (error.message.includes('Not authenticated') || 
          error.message.includes('Authentication failed') ||
          error.message.includes('401')) {
        return { authRequired: true, message: error.message };
      }
      
      throw error;
    }
  }
}

// Create a singleton instance
const apiSyncService = new ApiSyncService();

export default apiSyncService;
