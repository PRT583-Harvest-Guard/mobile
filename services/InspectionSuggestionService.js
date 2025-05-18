/**
 * Inspection Suggestion Service
 * Handles operations related to inspection suggestions
 */
import InspectionSuggestion from '@/models/InspectionSuggestion';
import { getFarms, getBoundaryData } from '@/services/BoundaryService';
import { updateObservationPointsWithInspectionData, getObservationPoints } from '@/services/ObservationService';
import { createInspectionObservationsForFarm } from '@/services/InspectionObservationService';

/**
 * Initialize the InspectionSuggestion table
 * @returns {Promise<void>}
 */
export const initInspectionSuggestionTable = async () => {
  try {
    await InspectionSuggestion.initTable();
  } catch (error) {
    if (__DEV__) console.error('Error initializing inspection suggestion table:', error);
    throw error;
  }
};

/**
 * Create a new inspection suggestion
 * @param {Object} suggestionData - The suggestion data
 * @returns {Promise<number>} The ID of the created suggestion
 */
export const createInspectionSuggestion = async (suggestionData) => {
  try {
    const suggestion = new InspectionSuggestion(suggestionData);
    return await suggestion.save();
  } catch (error) {
    if (__DEV__) console.error('Error creating inspection suggestion:', error);
    throw error;
  }
};

/**
 * Create a new inspection suggestion and create observations for all points in the farm
 * @param {Object} suggestionData - The suggestion data
 * @param {number} userId - The ID of the user creating the suggestion (defaults to 1)
 * @returns {Promise<Object>} Object containing the suggestion ID and observation IDs
 */
export const createInspectionSuggestionWithObservations = async (suggestionData, userId = 1) => {
  try {
    if (__DEV__) console.log('Creating inspection suggestion with observations:', JSON.stringify(suggestionData));
    
    // Create the suggestion
    const suggestionId = await createInspectionSuggestion(suggestionData);
    if (__DEV__) console.log('Suggestion created with ID:', suggestionId);
    
    // Get boundary points to verify they exist
    const boundaryPoints = await getBoundaryData(suggestionData.property_location);
    if (__DEV__) console.log('Found boundary points:', boundaryPoints ? boundaryPoints.length : 0);
    
    if (!boundaryPoints || boundaryPoints.length === 0) {
      if (__DEV__) console.warn('No boundary points found for farm ID:', suggestionData.property_location);
      
      // Delete the suggestion since we can't create observations without boundary points
      try {
        const suggestion = await InspectionSuggestion.findById(suggestionId);
        if (suggestion) {
          await suggestion.delete();
          if (__DEV__) console.log(`Deleted suggestion with ID ${suggestionId} due to missing boundary points`);
        }
      } catch (deleteError) {
        if (__DEV__) console.error('Error deleting suggestion:', deleteError);
      }
      
      // Throw an error to stop the workflow
      throw new Error('Cannot create inspection without boundary points. Please add boundary points to the farm first.');
    }
    
    // Get observation points for the farm
    if (__DEV__) console.log('Getting observation points for farm ID:', suggestionData.property_location);
    const observationPoints = await getObservationPoints(suggestionData.property_location);
    
    if (!observationPoints || observationPoints.length === 0) {
      if (__DEV__) console.warn('No observation points found for farm ID:', suggestionData.property_location);
      
      // Delete the suggestion since we can't update observation points
      try {
        const suggestion = await InspectionSuggestion.findById(suggestionId);
        if (suggestion) {
          await suggestion.delete();
          if (__DEV__) console.log(`Deleted suggestion with ID ${suggestionId} due to missing observation points`);
        }
      } catch (deleteError) {
        if (__DEV__) console.error('Error deleting suggestion:', deleteError);
      }
      
      // Throw an error to stop the workflow
      throw new Error('Cannot create inspection without observation points. Please add observation points to the farm first.');
    }
    
    // Update observation points with inspection suggestion data
    if (__DEV__) console.log('Updating observation points with inspection data');
    const updatedPoints = await updateObservationPointsWithInspectionData(
      suggestionData.property_location,
      suggestionId,
      suggestionData.confidence_level,
      suggestionData.target_entity
    );
    
    if (__DEV__) console.log(`Updated ${updatedPoints.length} observation points with inspection data`);
    
    // Verify points were updated
    if (!updatedPoints || updatedPoints.length === 0) {
      if (__DEV__) console.warn('No observation points were updated');
      
      // Delete the suggestion since we couldn't update observation points
      try {
        const suggestion = await InspectionSuggestion.findById(suggestionId);
        if (suggestion) {
          await suggestion.delete();
          if (__DEV__) console.log(`Deleted suggestion with ID ${suggestionId} due to failure to update observation points`);
        }
      } catch (deleteError) {
        if (__DEV__) console.error('Error deleting suggestion:', deleteError);
      }
      
      // Throw an error to stop the workflow
      throw new Error('Failed to update observation points. Please try again or contact support.');
    }
    
    // Create inspection observations for the farm
    if (__DEV__) console.log('Creating inspection observations for farm');
    const observationIds = await createInspectionObservationsForFarm(
      suggestionId,
      suggestionData.property_location,
      suggestionData.confidence_level,
      userId
    );
    
    if (__DEV__) console.log(`Created ${observationIds.length} inspection observations`);
    
    return {
      suggestionId,
      updatedPoints: updatedPoints.map(point => point.id),
      observationIds
    };
  } catch (error) {
    if (__DEV__) console.error('Error creating inspection suggestion with observations:', error);
    throw error;
  }
};

/**
 * Get all inspection suggestions
 * @returns {Promise<Array<InspectionSuggestion>>} Array of inspection suggestions
 */
export const getInspectionSuggestions = async () => {
  try {
    return await InspectionSuggestion.findAll();
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection suggestions:', error);
    throw error;
  }
};

/**
 * Get an inspection suggestion by ID
 * @param {number} id - The ID of the suggestion to get
 * @returns {Promise<InspectionSuggestion|null>} The suggestion or null if not found
 */
export const getInspectionSuggestionById = async (id) => {
  try {
    return await InspectionSuggestion.findById(id);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection suggestion:', error);
    throw error;
  }
};

/**
 * Get all inspection suggestions for a farm
 * @param {number} farmId - The ID of the farm
 * @returns {Promise<Array<InspectionSuggestion>>} Array of inspection suggestions
 */
export const getInspectionSuggestionsByFarmId = async (farmId) => {
  try {
    return await InspectionSuggestion.findByFarmId(farmId);
  } catch (error) {
    if (__DEV__) console.error('Error getting inspection suggestions for farm:', error);
    throw error;
  }
};

/**
 * Update an inspection suggestion
 * @param {number} id - The ID of the suggestion to update
 * @param {Object} suggestionData - The updated suggestion data
 * @returns {Promise<number>} The ID of the updated suggestion
 */
export const updateInspectionSuggestion = async (id, suggestionData) => {
  try {
    const suggestion = await InspectionSuggestion.findById(id);
    if (!suggestion) {
      throw new Error('Inspection suggestion not found');
    }
    
    // Update the suggestion properties
    Object.assign(suggestion, suggestionData);
    
    return await suggestion.save();
  } catch (error) {
    if (__DEV__) console.error('Error updating inspection suggestion:', error);
    throw error;
  }
};

/**
 * Delete an inspection suggestion
 * @param {number} id - The ID of the suggestion to delete
 * @returns {Promise<number>} Number of rows affected
 */
export const deleteInspectionSuggestion = async (id) => {
  try {
    const suggestion = await InspectionSuggestion.findById(id);
    if (!suggestion) {
      throw new Error('Inspection suggestion not found');
    }
    
    return await suggestion.delete();
  } catch (error) {
    if (__DEV__) console.error('Error deleting inspection suggestion:', error);
    throw error;
  }
};

/**
 * Get all farms for dropdown selection
 * @returns {Promise<Array<Object>>} Array of farms formatted for dropdown
 */
export const getFarmsForDropdown = async () => {
  try {
    const farms = await getFarms();
    
    // Ensure farms is an array
    if (!farms || !Array.isArray(farms)) {
      if (__DEV__) console.warn('getFarmsForDropdown: farms is not an array', farms);
      return [];
    }
    
    return farms.map(farm => ({
      label: farm.name || 'Unnamed Farm',
      value: farm.id
    }));
  } catch (error) {
    if (__DEV__) console.error('Error getting farms for dropdown:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};
