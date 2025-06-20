/**
 * Inspection Observation Service
 * Handles operations related to inspection observations
 */
import InspectionObservation from '@/models/InspectionObservation';
import { getBoundaryData, getFarms } from '@/services/BoundaryService';

/**
 * Initialize the InspectionObservation table
 * @returns {Promise<void>}
 */
export const initInspectionObservationTable = async () => {
  try {
    await InspectionObservation.initTable();
  } catch (error) {
    if (__DEV__) console.error('Error initializing inspection observation table:', error);
    throw error;
  }
};

/**
 * Create a new inspection observation
 * @param {Object} observationData - The observation data
 * @returns {Promise<number>} The ID of the created observation
 */
export const createInspectionObservation = async (observationData) => {
  try {
    const observation = new InspectionObservation(observationData);
    return await observation.save();
  } catch (error) {
    if (__DEV__) console.error('Error creating inspection observation:', error);
    throw error;
  }
};

/**
 * Get all inspection observations
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservations = async () => {
  try {
    return await InspectionObservation.findAll();
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations:', error);
    throw error;
  }
};

/**
 * Get an inspection observation by ID
 * @param {number} id - The ID of the observation to get
 * @returns {Promise<InspectionObservation|null>} The observation or null if not found
 */
export const getInspectionObservationById = async (id) => {
  try {
    return await InspectionObservation.findById(id);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observation:', error);
    throw error;
  }
};

/**
 * Get all inspection observations for an inspection
 * @param {number} inspectionId - The ID of the inspection
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservationsByInspectionId = async (inspectionId) => {
  try {
    return await InspectionObservation.findByInspectionId(inspectionId);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations for inspection:', error);
    throw error;
  }
};

/**
 * Get all inspection observations for a farm
 * @param {number} farmId - The ID of the farm
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservationsByFarmId = async (farmId) => {
  try {
    return await InspectionObservation.findByFarmId(farmId);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations for farm:', error);
    throw error;
  }
};

/**
 * Get all inspection observations by status
 * @param {string} status - The status to filter by (pending, completed, cancelled)
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservationsByStatus = async (status) => {
  try {
    return await InspectionObservation.findByStatus(status);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations by status:', error);
    throw error;
  }
};

/**
 * Get all inspection observations for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservationsByUserId = async (userId) => {
  try {
    return await InspectionObservation.findByUserId(userId);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations for user:', error);
    throw error;
  }
};

/**
 * Get all inspection observations for a user by status
 * @param {number} userId - The ID of the user
 * @param {string} status - The status to filter by (pending, completed, cancelled)
 * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
 */
export const getInspectionObservationsByUserIdAndStatus = async (userId, status) => {
  try {
    return await InspectionObservation.findByUserIdAndStatus(userId, status);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection observations for user by status:', error);
    throw error;
  }
};

/**
 * Update an inspection observation
 * @param {number} id - The ID of the observation to update
 * @param {Object} observationData - The updated observation data
 * @returns {Promise<number>} The ID of the updated observation
 */
export const updateInspectionObservation = async (id, observationData) => {
  try {
    const observation = await InspectionObservation.findById(id);
    if (!observation) {
      throw new Error('Inspection observation not found');
    }
    
    // Update the observation properties
    Object.assign(observation, observationData);
    
    return await observation.save();
  } catch (error) {
    if (__DEV__) console.error('Error updating inspection observation:', error);
    throw error;
  }
};

/**
 * Delete an inspection observation
 * @param {number} id - The ID of the observation to delete
 * @returns {Promise<number>} Number of rows affected
 */
export const deleteInspectionObservation = async (id) => {
  try {
    const observation = await InspectionObservation.findById(id);
    if (!observation) {
      throw new Error('Inspection observation not found');
    }
    
    return await observation.delete();
  } catch (error) {
    if (__DEV__) console.error('Error deleting inspection observation:', error);
    throw error;
  }
};

/**
 * Create inspection observations for all boundary points in a farm
 * @param {number} inspectionId - The ID of the inspection
 * @param {number} farmId - The ID of the farm
 * @param {string} confidence - The confidence level
 * @param {number} userId - The ID of the user creating the observations
 * @returns {Promise<Array<number>>} Array of created observation IDs
 */
export const createInspectionObservationsForFarm = async (inspectionId, farmId, confidence, userId = 1) => {
  try {
    // Get the farm details
    const farms = await getFarms();
    const farm = farms.find(f => f.id === Number(farmId));
    
    if (!farm) {
      throw new Error(`Farm with ID ${farmId} not found`);
    }
    
    // Get all boundary points for the farm
    const boundaryPoints = await getBoundaryData(farmId);
    
    if (!boundaryPoints || boundaryPoints.length === 0) {
      if (__DEV__) console.warn(`No boundary points found for farm ${farmId}`);
      return [];
    }
    
    // Create an observation for each boundary point
    const observationIds = [];
    
    for (const point of boundaryPoints) {
      if (!point) continue; // Skip null points
      
      // Get details from the farm instance
      const observationData = {
        date: new Date().toISOString(),
        inspection_id: inspectionId,
        confidence: confidence,
        section_id: point.id || null, // Using boundary point ID as section ID
        farm_id: farmId,
        user_id: userId,
        plant_per_section: farm.plant_type || 'Unknown',
        status: 'pending',
        target_entity: farm.plant_type || 'Unknown',
        // Additional farm details
        farm_name: farm.name || 'Unknown Farm',
        farm_size: farm.size || 0,
        farm_location: farm.location || 'Unknown Location'
      };
      
      const observationId = await createInspectionObservation(observationData);
      observationIds.push(observationId);
    }
    
    if (__DEV__) console.log(`Created ${observationIds.length} inspection observations for farm ${farmId}`);
    return observationIds;
  } catch (error) {
    if (__DEV__) console.error('Error creating inspection observations for farm:', error);
    throw error;
  }
};

/**
 * Update the status of an inspection observation
 * @param {number} id - The ID of the observation to update
 * @param {string} status - The new status (pending, completed, cancelled)
 * @returns {Promise<number>} The ID of the updated observation
 */
export const updateInspectionObservationStatus = async (id, status) => {
  try {
    return await updateInspectionObservation(id, { status });
  } catch (error) {
    if (__DEV__) console.error('Error updating inspection observation status:', error);
    throw error;
  }
};

/**
 * Get all completed inspection observations
 * @param {number} userId - Optional user ID to filter by
 * @returns {Promise<Array<InspectionObservation>>} Array of completed inspection observations
 */
export const getCompletedInspectionObservations = async (userId = null) => {
  try {
    // Get observations by status, filtered by user ID if provided
    const observations = userId 
      ? await InspectionObservation.findByUserIdAndStatus(userId, 'completed')
      : await getInspectionObservationsByStatus('completed');
    
    // Refresh farm details for each observation
    await refreshFarmDetailsForObservations(observations);
    
    return observations;
  } catch (error) {
    if (__DEV__) console.error('Error getting completed inspection observations:', error);
    throw error;
  }
};

/**
 * Get all pending inspection observations
 * @param {number} userId - Optional user ID to filter by
 * @returns {Promise<Array<InspectionObservation>>} Array of pending inspection observations
 */
export const getPendingInspectionObservations = async (userId = null) => {
  try {
    // Get observations by status, filtered by user ID if provided
    const observations = userId 
      ? await InspectionObservation.findByUserIdAndStatus(userId, 'pending')
      : await getInspectionObservationsByStatus('pending');
    
    // Refresh farm details for each observation
    await refreshFarmDetailsForObservations(observations);
    
    return observations;
  } catch (error) {
    if (__DEV__) console.error('Error getting pending inspection observations:', error);
    throw error;
  }
};

/**
 * Helper function to refresh farm details for an array of observations
 * @param {Array<InspectionObservation>} observations - Array of observations to refresh
 * @returns {Promise<void>}
 * @private
 */
const refreshFarmDetailsForObservations = async (observations) => {
  if (!observations || observations.length === 0) return;
  
  try {
    const farms = await getFarms();
    
    for (const observation of observations) {
      try {
        const farm = farms.find(f => f.id === observation.farm_id);
        
        if (farm) {
          observation.plant_per_section = farm.plant_type || observation.plant_per_section;
          observation.farm_name = farm.name || 'Unknown Farm';
          observation.farm_size = farm.size || 0;
          observation.farm_location = farm.location || 'Unknown Location';
        }
      } catch (error) {
        if (__DEV__) console.warn('Error refreshing farm details for observation:', error);
        // Continue with the next observation
      }
    }
  } catch (error) {
    if (__DEV__) console.error('Error refreshing farm details for observations:', error);
    // Don't throw the error to avoid breaking the main function
  }
};
