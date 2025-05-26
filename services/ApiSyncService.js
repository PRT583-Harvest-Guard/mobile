/**
 * API Sync Service
 * Handles synchronization of local data with the Django API
 */
import { Alert } from 'react-native';
import config from '../config/env';
import apiAuthService from './ApiAuthService';
import databaseService from './DatabaseService';
import AuthService from './AuthService';

// API endpoints
const ENDPOINTS = config.api.endpoints;

class ApiSyncService {
  constructor() {
    this.lastSyncStats = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the API sync service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize the database service
      await databaseService.initialize();

      // Initialize the auth service
      await apiAuthService.initialize();

      this.isInitialized = true;
      console.log('API Sync Service initialized');
    } catch (error) {
      console.error('API Sync Service initialization error:', error);
      throw error;
    }
  }

  /**
   * Get the current local user ID from the stored credentials
   * @returns {Promise<number|null>} Local user ID or null
   */
  async getCurrentLocalUserId() {
    try {
      // Get stored credentials from the auth service
      const credentials = await apiAuthService.getStoredCredentials();
      
      if (!credentials || !credentials.username) {
        console.log('No stored credentials available to get local user ID');
        return null;
      }

      // Find the user in the local database by username
      const user = await AuthService.findUserByUsername(credentials.username);
      
      if (user && user.id) {
        console.log('Current local user ID:', user.id);
        return user.id;
      }

      console.log('No local user found for username:', credentials.username);
      return null;
    } catch (error) {
      console.error('Error getting current local user ID:', error);
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
   * Set the online status (delegates to ApiAuthService)
   * @param {boolean} isOnline - Whether the app is online
   */
  setOnlineStatus(isOnline) {
    apiAuthService.setOnlineStatus(isOnline);
  }

  /**
   * Check if the user is authenticated (delegates to ApiAuthService)
   * @param {boolean} skipTokenVerification - Whether to skip token verification
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  async isAuthenticated(skipTokenVerification = false) {
    return await apiAuthService.isAuthenticated(skipTokenVerification);
  }

  /**
   * Authenticate with the Django API (delegates to ApiAuthService)
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(credentials) {
    return await apiAuthService.authenticate(credentials);
  }

  /**
   * Sign out (delegates to ApiAuthService)
   * @returns {Promise<void>}
   */
  async signOut() {
    return await apiAuthService.signOut();
  }

  /**
   * Get the last sync time (delegates to ApiAuthService)
   * @returns {Promise<string|null>} Last sync time or null
   */
  async getLastSyncTime() {
    return await apiAuthService.getLastSyncTime();
  }

  /**
   * Check if the API is reachable (delegates to ApiAuthService)
   * @returns {Promise<boolean>} Whether the API is reachable
   */
  async isApiReachable() {
    return await apiAuthService.isApiReachable();
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
      if (!apiAuthService.isOnline) {
        throw new Error('Cannot sync while offline');
      }

      // Check if we're authenticated, but skip token verification to prevent continuous token refresh
      const isAuth = await apiAuthService.isAuthenticated(true);

      if (!isAuth) {
        // We need to re-authenticate
        const credentials = await apiAuthService.getStoredCredentials();

        if (credentials) {
          const authResult = await apiAuthService.authenticate(credentials);
          if (!authResult.success) {
            // Authentication failed, return a special error object
            return { authRequired: true, message: 'Authentication failed' };
          }
        } else {
          // No credentials, return a special error object
          return { authRequired: true, message: 'Authentication required' };
        }
      }

      console.log('Starting full sync with Django API...');

      // Prepare data for sync
      const [
        farms,
        boundaryPoints,
        observationPoints,
        inspectionSuggestions,
        inspectionObservations
      ] = await Promise.all([
        this.prepareFarmsForSync(),
        this.prepareBoundaryPointsForSync(),
        this.prepareObservationPointsForSync(),
        this.prepareInspectionSuggestionsForSync(),
        this.prepareInspectionObservationsForSync()
      ]);

      console.log('Data prepared for sync:', {
        farms: farms.length,
        boundaryPoints: boundaryPoints.length,
        observationPoints: observationPoints.length,
        inspectionSuggestions: inspectionSuggestions.length,
        inspectionObservations: inspectionObservations.length
      });

      // Sync data with the API
      const syncData = {
        farms,
        boundary_points: boundaryPoints,
        observation_points: observationPoints,
        inspection_suggestions: inspectionSuggestions,
        inspection_observations: inspectionObservations
      };

      const result = await apiAuthService.makeAuthenticatedRequest(ENDPOINTS.syncData, {
        method: 'POST',
        body: JSON.stringify(syncData)
      });

      console.log('Sync API response:', result);

      // Store the sync stats
      this.lastSyncStats = {
        farms: result.results?.farms?.length || 0,
        boundaryPoints: result.results?.boundary_points?.length || 0,
        observationPoints: result.results?.observation_points?.length || 0,
        inspectionSuggestions: result.results?.inspection_suggestions?.length || 0,
        inspectionObservations: result.results?.inspection_observations?.length || 0,
        timestamp: new Date().toISOString(),
      };

      // Save the last sync time
      await apiAuthService.saveLastSyncTime();

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
   * Prepare farms for sync (only for current local user)
   * @returns {Promise<Array>} Farms to sync
   */
  async prepareFarmsForSync() {
    try {
      await databaseService.initialize();
      
      // Get the current local user ID
      const currentLocalUserId = await this.getCurrentLocalUserId();
      
      let farms;
      
      if (currentLocalUserId) {
        // Get farms filtered by current local user ID
        console.log(`Getting farms for local user ID: ${currentLocalUserId}`);
        
        try {
          // Try to get farms filtered by user_id
          farms = await databaseService.getAll('farms', 'user_id = ?', [currentLocalUserId], 'ORDER BY created_at DESC');
        } catch (error) {
          // If there's an error with the user_id filter (e.g., column doesn't exist yet),
          // fall back to getting all farms
          if (error.message && (
              error.message.includes('no such column: user_id') || 
              error.message.includes('user_id')
          )) {
            console.warn('user_id column not available, getting all farms');
            farms = await databaseService.getAll('farms', '', [], 'ORDER BY created_at DESC');
          } else {
            throw error;
          }
        }
      } else {
        // If we can't get the local user ID, get all farms (fallback)
        console.warn('No current local user ID available, getting all farms');
        farms = await databaseService.getAll('farms', '', [], 'ORDER BY created_at DESC');
      }
      
      console.log(`Found ${farms.length} farms to sync for local user ${currentLocalUserId || 'unknown'}`);
      
      // Transform farms for API - Django expects 'id' not 'local_id'
      return farms.map(farm => ({
        id: farm.id,  // Django expects 'id'
        name: farm.name,
        size: farm.size,
        plant_type: farm.plant_type,
        location: farm.location || null,
        created_at: farm.created_at,
        updated_at: farm.updated_at || farm.created_at
      }));
    } catch (error) {
      console.error('Error preparing farms for sync:', error);
      return [];
    }
  }

  /**
   * Prepare boundary points for sync (only for current local user's farms)
   * @returns {Promise<Array>} Boundary points to sync
   */
  async prepareBoundaryPointsForSync() {
    try {
      await databaseService.initialize();
      
      // Get the current local user ID
      const currentLocalUserId = await this.getCurrentLocalUserId();
      
      let boundaryPoints;
      
      if (currentLocalUserId) {
        // Get boundary points for farms owned by the current local user
        console.log(`Getting boundary points for local user ID: ${currentLocalUserId}`);
        
        try {
          // Join with farms table to filter by user_id
          const query = `
            SELECT bp.* FROM boundary_points bp
            INNER JOIN farms f ON bp.farm_id = f.id
            WHERE f.user_id = ?
            ORDER BY bp.farm_id, bp.timestamp
          `;
          boundaryPoints = await databaseService.query(query, [currentLocalUserId]);
        } catch (error) {
          // If there's an error with the user_id filter, fall back to getting all boundary points
          if (error.message && (
              error.message.includes('no such column: user_id') || 
              error.message.includes('user_id')
          )) {
            console.warn('user_id column not available, getting all boundary points');
            boundaryPoints = await databaseService.getAll('boundary_points', '', [], 'ORDER BY farm_id, timestamp');
          } else {
            throw error;
          }
        }
      } else {
        // If we can't get the local user ID, get all boundary points (fallback)
        console.warn('No current local user ID available, getting all boundary points');
        boundaryPoints = await databaseService.getAll('boundary_points', '', [], 'ORDER BY farm_id, timestamp');
      }
      
      console.log(`Found ${boundaryPoints.length} boundary points to sync for local user ${currentLocalUserId || 'unknown'}`);
      
      // Transform boundary points for API - Django expects 'id' and 'farm_id'
      return boundaryPoints.map(point => ({
        id: point.id,  // Django expects 'id'
        farm_id: point.farm_id,
        latitude: point.latitude,
        longitude: point.longitude,
        description: point.description,
        photo_uri: point.photo_uri,
        timestamp: point.timestamp
      }));
    } catch (error) {
      console.error('Error preparing boundary points for sync:', error);
      return [];
    }
  }

  /**
   * Prepare observation points for sync (only for current local user's farms)
   * @returns {Promise<Array>} Observation points to sync
   */
  async prepareObservationPointsForSync() {
    try {
      await databaseService.initialize();
      
      // Get the current local user ID
      const currentLocalUserId = await this.getCurrentLocalUserId();
      
      let observationPoints;
      
      if (currentLocalUserId) {
        // Get observation points for farms owned by the current local user
        console.log(`Getting observation points for local user ID: ${currentLocalUserId}`);
        
        try {
          // Join with farms table to filter by user_id
          const query = `
            SELECT op.* FROM observation_points op
            INNER JOIN farms f ON op.farm_id = f.id
            WHERE f.user_id = ?
            ORDER BY op.farm_id, op.segment
          `;
          observationPoints = await databaseService.query(query, [currentLocalUserId]);
        } catch (error) {
          // If there's an error with the user_id filter, fall back to getting all observation points
          if (error.message && (
              error.message.includes('no such column: user_id') || 
              error.message.includes('user_id')
          )) {
            console.warn('user_id column not available, getting all observation points');
            observationPoints = await databaseService.getAll('observation_points', '', [], 'ORDER BY farm_id, segment');
          } else {
            throw error;
          }
        }
      } else {
        // If we can't get the local user ID, get all observation points (fallback)
        console.warn('No current local user ID available, getting all observation points');
        observationPoints = await databaseService.getAll('observation_points', '', [], 'ORDER BY farm_id, segment');
      }
      
      console.log(`Found ${observationPoints.length} observation points to sync for local user ${currentLocalUserId || 'unknown'}`);
      
      // Transform observation points for API - Django expects 'id' and 'farm_id'
      return observationPoints.map(point => ({
        id: point.id,  // Django expects 'id'
        farm_id: point.farm_id,
        latitude: point.latitude,
        longitude: point.longitude,
        segment: point.segment,
        observation_id: point.observation_id,
        observation_status: point.observation_status,
        name: point.name,
        inspection_suggestion_id: point.inspection_suggestion_id,
        confidence_level: point.confidence_level,
        target_entity: point.target_entity,
        created_at: point.created_at
      }));
    } catch (error) {
      console.error('Error preparing observation points for sync:', error);
      return [];
    }
  }

  /**
   * Prepare inspection suggestions for sync (only for current local user's farms)
   * @returns {Promise<Array>} Inspection suggestions to sync
   */
  async prepareInspectionSuggestionsForSync() {
    try {
      await databaseService.initialize();
      
      // Get the current local user ID
      const currentLocalUserId = await this.getCurrentLocalUserId();
      
      let suggestions;
      
      if (currentLocalUserId) {
        // Get inspection suggestions for farms owned by the current local user
        console.log(`Getting inspection suggestions for local user ID: ${currentLocalUserId}`);
        
        try {
          // Join with farms table to filter by user_id - changed 'is' to 'ins' to avoid SQL reserved keyword
          const query = `
            SELECT ins.* FROM inspection_suggestions ins
            INNER JOIN farms f ON ins.property_location = f.id
            WHERE f.user_id = ?
            ORDER BY ins.created_at DESC
          `;
          suggestions = await databaseService.query(query, [currentLocalUserId]);
        } catch (error) {
          // If there's an error with the user_id filter, fall back to getting all suggestions
          if (error.message && (
              error.message.includes('no such column: user_id') || 
              error.message.includes('user_id')
          )) {
            console.warn('user_id column not available, getting all inspection suggestions');
            suggestions = await databaseService.getAll('inspection_suggestions', '', [], 'ORDER BY created_at DESC');
          } else {
            throw error;
          }
        }
      } else {
        // If we can't get the local user ID, get all suggestions (fallback)
        console.warn('No current local user ID available, getting all inspection suggestions');
        suggestions = await databaseService.getAll('inspection_suggestions', '', [], 'ORDER BY created_at DESC');
      }
      
      console.log(`Found ${suggestions.length} inspection suggestions to sync for local user ${currentLocalUserId || 'unknown'}`);
      
      // Transform inspection suggestions for API - Django expects 'id' and 'property_location'
      return suggestions.map(suggestion => ({
        id: suggestion.id,  // Django expects 'id'
        property_location: suggestion.property_location,  // Django expects 'property_location'
        target_entity: suggestion.target_entity,
        confidence_level: suggestion.confidence_level,
        suggestion_text: suggestion.suggestion_text,
        priority: suggestion.priority,
        status: suggestion.status,
        area_size: suggestion.area_size || 0,  // Default value as Django expects this
        density_of_plant: suggestion.density_of_plant || 0,  // Default value as Django expects this
        created_at: suggestion.created_at,
        updated_at: suggestion.updated_at
      }));
    } catch (error) {
      console.error('Error preparing inspection suggestions for sync:', error);
      return [];
    }
  }

  /**
   * Prepare inspection observations for sync (only for current local user's farms)
   * @returns {Promise<Array>} Inspection observations to sync
   */
  async prepareInspectionObservationsForSync() {
    try {
      await databaseService.initialize();
      
      // Get the current local user ID
      const currentLocalUserId = await this.getCurrentLocalUserId();
      
      let observations;
      
      if (currentLocalUserId) {
        // Get inspection observations for farms owned by the current local user
        console.log(`Getting inspection observations for local user ID: ${currentLocalUserId}`);
        
        try {
          // Join with farms table to filter by user_id
          const query = `
            SELECT io.* FROM inspection_observations io
            INNER JOIN farms f ON io.farm_id = f.id
            WHERE f.user_id = ?
            ORDER BY io.created_at DESC
          `;
          observations = await databaseService.query(query, [currentLocalUserId]);
        } catch (error) {
          // If there's an error with the user_id filter, fall back to getting all observations
          if (error.message && (
              error.message.includes('no such column: user_id') || 
              error.message.includes('user_id')
          )) {
            console.warn('user_id column not available, getting all inspection observations');
            observations = await databaseService.getAll('inspection_observations', '', [], 'ORDER BY created_at DESC');
          } else {
            throw error;
          }
        }
      } else {
        // If we can't get the local user ID, get all observations (fallback)
        console.warn('No current local user ID available, getting all inspection observations');
        observations = await databaseService.getAll('inspection_observations', '', [], 'ORDER BY created_at DESC');
      }
      
      console.log(`Found ${observations.length} inspection observations to sync for local user ${currentLocalUserId || 'unknown'}`);
      
      // Transform inspection observations for API - Django expects specific field names
      return observations.map(observation => ({
        id: observation.id,  // Django expects 'id'
        farm: observation.farm_id,  // Django expects 'farm' not 'farm_id'
        inspection: observation.inspection_id,  // Django expects 'inspection'
        date: observation.date,  // Django expects 'date'
        confidence: observation.confidence || '',
        plant_per_section: observation.plant_per_section || '',
        status: observation.status || '',
        target_entity: observation.target_entity,
        severity: observation.severity || null,
        observation_text: observation.observation_text,
        farm_name: observation.farm_name,
        farm_size: observation.farm_size,
        farm_location: observation.farm_location,
        photo_uri: observation.photo_uri,
        created_at: observation.created_at,
        updated_at: observation.updated_at
      }));
    } catch (error) {
      console.error('Error preparing inspection observations for sync:', error);
      return [];
    }
  }

  /**
   * Sync individual farm data
   * @param {number} farmId - Farm ID to sync
   * @returns {Promise<Object>} Sync result for the farm
   */
  async syncFarmData(farmId) {
    try {
      await this.initialize();

      // Check authentication
      const isAuth = await apiAuthService.isAuthenticated(true);
      if (!isAuth) {
        throw new Error('Authentication required');
      }

      console.log(`Starting sync for farm ID: ${farmId}`);

      // Get farm-specific data
      const farm = await databaseService.getById('farms', 'id', farmId);
      if (!farm) {
        throw new Error(`Farm with ID ${farmId} not found`);
      }

      // Verify that the farm belongs to the current local user
      const currentLocalUserId = await this.getCurrentLocalUserId();
      if (currentLocalUserId && farm.user_id && farm.user_id !== currentLocalUserId) {
        throw new Error(`Farm ${farmId} does not belong to the current user`);
      }

      // Get boundary points for this farm
      const boundaryPoints = await databaseService.getAll('boundary_points', 'farm_id = ?', [farmId]);
      
      // Get observation points for this farm
      const observationPoints = await databaseService.getAll('observation_points', 'farm_id = ?', [farmId]);
      
      // Get inspection suggestions for this farm
      const inspectionSuggestions = await databaseService.getAll('inspection_suggestions', 'property_location = ?', [farmId]);
      
      // Get inspection observations for this farm
      const inspectionObservations = await databaseService.getAll('inspection_observations', 'farm_id = ?', [farmId]);

      // Prepare sync data with correct field mappings for Django
      const syncData = {
        farms: [{
          id: farm.id,  // Django expects 'id'
          name: farm.name,
          size: farm.size,
          plant_type: farm.plant_type,
          location: farm.location || null,
          created_at: farm.created_at,
          updated_at: farm.updated_at || farm.created_at
        }],
        boundary_points: boundaryPoints.map(point => ({
          id: point.id,  // Django expects 'id'
          farm_id: point.farm_id,
          latitude: point.latitude,
          longitude: point.longitude,
          description: point.description,
          photo_uri: point.photo_uri,
          timestamp: point.timestamp
        })),
        observation_points: observationPoints.map(point => ({
          id: point.id,  // Django expects 'id'
          farm_id: point.farm_id,
          latitude: point.latitude,
          longitude: point.longitude,
          segment: point.segment,
          observation_id: point.observation_id,
          observation_status: point.observation_status,
          name: point.name,
          inspection_suggestion_id: point.inspection_suggestion_id,
          confidence_level: point.confidence_level,
          target_entity: point.target_entity,
          created_at: point.created_at
        })),
        inspection_suggestions: inspectionSuggestions.map(suggestion => ({
          id: suggestion.id,  // Django expects 'id'
          property_location: suggestion.property_location,  // Django expects 'property_location'
          target_entity: suggestion.target_entity,
          confidence_level: suggestion.confidence_level,
          suggestion_text: suggestion.suggestion_text,
          priority: suggestion.priority,
          status: suggestion.status,
          area_size: suggestion.area_size || 0,
          density_of_plant: suggestion.density_of_plant || 0,
          created_at: suggestion.created_at,
          updated_at: suggestion.updated_at
        })),
        inspection_observations: inspectionObservations.map(observation => ({
          id: observation.id,  // Django expects 'id'
          farm: observation.farm_id,  // Django expects 'farm'
          inspection: observation.inspection_id,  // Django expects 'inspection'
          date: observation.date,
          confidence: observation.confidence || '',
          plant_per_section: observation.plant_per_section || '',
          status: observation.status || '',
          target_entity: observation.target_entity,
          severity: observation.severity || null,
          observation_text: observation.observation_text,
          farm_name: observation.farm_name,
          farm_size: observation.farm_size,
          farm_location: observation.farm_location,
          photo_uri: observation.photo_uri,
          created_at: observation.created_at,
          updated_at: observation.updated_at
        }))
      };

      console.log(`Farm ${farmId} sync data prepared:`, {
        farms: syncData.farms.length,
        boundaryPoints: syncData.boundary_points.length,
        observationPoints: syncData.observation_points.length,
        inspectionSuggestions: syncData.inspection_suggestions.length,
        inspectionObservations: syncData.inspection_observations.length
      });

      // Send to API
      const result = await apiAuthService.makeAuthenticatedRequest(ENDPOINTS.syncData, {
        method: 'POST',
        body: JSON.stringify(syncData)
      });

      console.log(`Farm ${farmId} sync completed:`, result);
      return result;

    } catch (error) {
      console.error(`Error syncing farm ${farmId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status
   * @returns {Promise<Object>} Sync status information
   */
  async getSyncStatus() {
    try {
      await this.initialize();

      const lastSyncTime = await apiAuthService.getLastSyncTime();
      const isAuthenticated = await apiAuthService.isAuthenticated(true);
      const isApiReachable = await apiAuthService.isApiReachable();

      return {
        lastSyncTime,
        isAuthenticated,
        isApiReachable,
        lastSyncStats: this.lastSyncStats
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSyncTime: null,
        isAuthenticated: false,
        isApiReachable: false,
        lastSyncStats: null,
        error: error.message
      };
    }
  }
}

// Create a singleton instance
const apiSyncService = new ApiSyncService();

export default apiSyncService;
