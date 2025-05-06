/**
 * Inspection Suggestion Service
 * Handles operations related to inspection suggestions
 */
import InspectionSuggestion from '@/models/InspectionSuggestion';
import { getFarms } from '@/services/BoundaryService';

/**
 * Initialize the InspectionSuggestion table
 * @returns {Promise<void>}
 */
export const initInspectionSuggestionTable = async () => {
  try {
    await InspectionSuggestion.initTable();
  } catch (error) {
    console.error('Error initializing inspection suggestion table:', error);
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
    console.error('Error creating inspection suggestion:', error);
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
    console.error('Error getting inspection suggestions:', error);
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
    console.error('Error getting inspection suggestion:', error);
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
    console.error('Error getting inspection suggestions for farm:', error);
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
    console.error('Error updating inspection suggestion:', error);
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
    console.error('Error deleting inspection suggestion:', error);
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
      console.warn('getFarmsForDropdown: farms is not an array', farms);
      return [];
    }
    
    return farms.map(farm => ({
      label: farm.name || 'Unnamed Farm',
      value: farm.id
    }));
  } catch (error) {
    console.error('Error getting farms for dropdown:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};
