/**
 * Inspection Observation Service
 * Handles operations related to inspection observations
 */
import InspectionObservation from '@/models/InspectionObservation';
import { getBoundaryData } from '@/services/BoundaryService';
import { getFarms } from '@/services/BoundaryService';

/**
 * Initialize the InspectionObservation table
 * @returns {Promise<void>}
 */
export const initInspectionObservationTable = async () => {
  try {
    await InspectionObservation.initTable();
  } catch (error) {
    console.error('Error initializing inspection observation table:', error);
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
    console.error('Error creating inspection observation:', error);
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
    console.error('Error getting inspection observations:', error);
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
    console.error('Error getting inspection observation:', error);
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
    console.error('Error getting inspection observations for inspection:', error);
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
    console.error('Error getting inspection observations for farm:', error);
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
    console.error('Error getting inspection observations by status:', error);
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
    console.error('Error updating inspection observation:', error);
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
    console.error('Error deleting inspection observation:', error);
    throw error;
  }
};

/**
 * Create inspection observations for all observation points in a farm
 * @param {number} inspectionId - The ID of the inspection
 * @param {number} farmId - The ID of the farm
 * @param {string} confidence - The confidence level
 * @returns {Promise<Array<number>>} Array of created observation IDs
 */
export const createInspectionObservationsForFarm = async (inspectionId, farmId, confidence) => {
  try {
    // Get the farm details
    const farms = await getFarms();
    const farm = farms.find(f => f.id === farmId);
    
    if (!farm) {
      throw new Error(`Farm with ID ${farmId} not found`);
    }
    
    // Get all boundary points for the farm
    const boundaryPoints = await getBoundaryData(farmId);
    
    if (!boundaryPoints || !Array.isArray(boundaryPoints) || boundaryPoints.length === 0) {
      console.warn(`No boundary points found for farm ${farmId}`);
      return [];
    }
    
    // Create an observation for each boundary point
    const observationIds = [];
    
    for (const point of boundaryPoints) {
      if (!point) continue; // Skip null points
      
      const observationData = {
        date: new Date().toISOString(),
        inspection_id: inspectionId,
        confidence: confidence,
        section_id: point.id || null, // Using boundary point ID as section ID, default to null if not available
        farm_id: farmId,
        plant_per_section: farm && farm.plant_type ? farm.plant_type : 'Unknown',
        status: 'pending'
      };
      
      const observationId = await createInspectionObservation(observationData);
      observationIds.push(observationId);
    }
    
    return observationIds;
  } catch (error) {
    console.error('Error creating inspection observations for farm:', error);
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
    console.error('Error updating inspection observation status:', error);
    throw error;
  }
};

/**
 * Get all completed inspection observations
 * @returns {Promise<Array<InspectionObservation>>} Array of completed inspection observations
 */
export const getCompletedInspectionObservations = async () => {
  try {
    return await getInspectionObservationsByStatus('completed');
  } catch (error) {
    console.error('Error getting completed inspection observations:', error);
    throw error;
  }
};

/**
 * Get all pending inspection observations
 * @returns {Promise<Array<InspectionObservation>>} Array of pending inspection observations
 */
export const getPendingInspectionObservations = async () => {
  try {
    return await getInspectionObservationsByStatus('pending');
  } catch (error) {
    console.error('Error getting pending inspection observations:', error);
    throw error;
  }
};
