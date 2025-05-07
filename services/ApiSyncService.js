/**
 * API Sync Service
 * Handles synchronization of local data with the Django API
 */
import AuthService from './AuthService';
import databaseService from './DatabaseService';
import { Alert } from 'react-native';

// API base URL - replace with your actual Django API URL
const API_BASE_URL = 'https://api.harvestguard.com';

// API endpoints
const ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  FARMS: '/api/farms/',
  BOUNDARY_POINTS: '/api/boundary-points/',
  OBSERVATION_POINTS: '/api/observation-points/',
  INSPECTION_SUGGESTIONS: '/api/inspection-suggestions/',
  INSPECTION_OBSERVATIONS: '/api/inspection-observations/',
  SYNC: '/api/sync/',
};

class ApiSyncService {
  constructor() {
    this.token = null;
    this.userId = null;
    this.lastSyncStats = null;
  }

  /**
   * Initialize the API service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize the database service
      await databaseService.initialize();
      console.log('API Sync Service initialized');
    } catch (error) {
      console.error('API Sync Service initialization error:', error);
      throw error;
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
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.userId = data.user_id;

      return data;
    } catch (error) {
      console.error('API authentication error:', error);
      throw error;
    }
  }

  /**
   * Register a new user with the Django API
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API registration error:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.token}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Sync all local data with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncAll() {
    try {
      // Make sure we're authenticated
      if (!this.token) {
        // Try to get credentials from local storage
        const credentials = await this.getStoredCredentials();
        if (credentials) {
          await this.authenticate(credentials);
        } else {
          throw new Error('Not authenticated');
        }
      }

      // Start sync process
      console.log('Starting sync process...');
      
      // 1. Sync farms
      const farms = await this.syncFarms();
      
      // 2. Sync boundary points
      const boundaryPoints = await this.syncBoundaryPoints();
      
      // 3. Sync observation points
      const observationPoints = await this.syncObservationPoints();
      
      // 4. Sync inspection suggestions
      const inspectionSuggestions = await this.syncInspectionSuggestions();
      
      // 5. Sync inspection observations
      const inspectionObservations = await this.syncInspectionObservations();

      // Return sync results
      return {
        farms,
        boundaryPoints,
        observationPoints,
        inspectionSuggestions,
        inspectionObservations,
      };
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Error', error.message);
      throw error;
    }
  }

  /**
   * Get stored credentials from local storage
   * @returns {Promise<Object|null>} Credentials or null
   */
  async getStoredCredentials() {
    // This is a placeholder - in a real app, you would retrieve
    // credentials from secure storage
    return null;
  }

  /**
   * Sync farms with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncFarms() {
    try {
      // Get all farms from local database
      const localFarms = await databaseService.getAll('farms');
      
      // Send farms to API
      const response = await this.apiRequest(ENDPOINTS.FARMS, 'POST', {
        farms: localFarms,
      });
      
      return response;
    } catch (error) {
      console.error('Farm sync error:', error);
      throw error;
    }
  }

  /**
   * Sync boundary points with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncBoundaryPoints() {
    try {
      // Get all boundary points from local database
      const localBoundaryPoints = await databaseService.getAll('boundary_points');
      
      // Send boundary points to API
      const response = await this.apiRequest(ENDPOINTS.BOUNDARY_POINTS, 'POST', {
        boundary_points: localBoundaryPoints,
      });
      
      return response;
    } catch (error) {
      console.error('Boundary points sync error:', error);
      throw error;
    }
  }

  /**
   * Sync observation points with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncObservationPoints() {
    try {
      // Get all observation points from local database
      const localObservationPoints = await databaseService.getAll('observation_points');
      
      // Send observation points to API
      const response = await this.apiRequest(ENDPOINTS.OBSERVATION_POINTS, 'POST', {
        observation_points: localObservationPoints,
      });
      
      return response;
    } catch (error) {
      console.error('Observation points sync error:', error);
      throw error;
    }
  }

  /**
   * Sync inspection suggestions with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncInspectionSuggestions() {
    try {
      // Get all inspection suggestions from local database
      const localInspectionSuggestions = await databaseService.getAll('inspection_suggestions');
      
      // Send inspection suggestions to API
      const response = await this.apiRequest(ENDPOINTS.INSPECTION_SUGGESTIONS, 'POST', {
        inspection_suggestions: localInspectionSuggestions,
      });
      
      return response;
    } catch (error) {
      console.error('Inspection suggestions sync error:', error);
      throw error;
    }
  }

  /**
   * Sync inspection observations with the Django API
   * @returns {Promise<Object>} Sync result
   */
  async syncInspectionObservations() {
    try {
      // Get all inspection observations from local database
      const localInspectionObservations = await databaseService.getAll('inspection_observations');
      
      // Send inspection observations to API
      const response = await this.apiRequest(ENDPOINTS.INSPECTION_OBSERVATIONS, 'POST', {
        inspection_observations: localInspectionObservations,
      });
      
      return response;
    } catch (error) {
      console.error('Inspection observations sync error:', error);
      throw error;
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
      
      // Perform the sync
      const result = await this.syncAll();
      
      // Store the sync stats
      this.lastSyncStats = {
        farms: result.farms?.length || 0,
        boundaryPoints: result.boundaryPoints?.length || 0,
        observationPoints: result.observationPoints?.length || 0,
        inspectionSuggestions: result.inspectionSuggestions?.length || 0,
        inspectionObservations: result.inspectionObservations?.length || 0,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Sync completed successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Full sync error:', error);
      Alert.alert('Sync Error', error.message);
      throw error;
    }
  }
}

// Create a singleton instance
const apiSyncService = new ApiSyncService();

export default apiSyncService;
