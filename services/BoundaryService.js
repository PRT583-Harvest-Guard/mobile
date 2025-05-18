/**
 * Boundary Service
 * Handles operations related to farm boundaries
 */
import databaseService from './DatabaseService';
import { getInspectionObservationsByFarmId, updateInspectionObservation } from '@/services/InspectionObservationService';
import { getInspectionSuggestionsByFarmId, deleteInspectionSuggestion } from '@/services/InspectionSuggestionService';

/**
 * Create a new farm
 * @param {Object} farmData - Farm data
 * @param {string} farmData.name - Farm name
 * @param {number} farmData.size - Farm size
 * @param {string} farmData.plant_type - Plant type
 * @returns {Promise<number>} - ID of the created farm
 */
export const createFarm = async (farmData) => {
  try {
    await databaseService.initialize();
    
    const { name, size, plant_type } = farmData;
    return await databaseService.insert('farms', {
      name,
      size,
      plant_type
    });
  } catch (error) {
    if (__DEV__) console.error('Error creating farm:', error);
    throw error;
  }
};

/**
 * Get all farms
 * @returns {Promise<Array>} - List of farms
 */
export const getFarms = async () => {
  try {
    await databaseService.initialize();
    return await databaseService.getAll('farms', '', [], 'ORDER BY created_at DESC');
  } catch (error) {
    if (__DEV__) console.error('Error getting farms:', error);
    throw error;
  }
};

/**
 * Save boundary data for a farm
 * @param {number} farmId - Farm ID
 * @param {Array} points - Boundary points
 * @returns {Promise<Array>} - Saved boundary points
 */
export const saveBoundaryData = async (farmId, points) => {
  try {
    await databaseService.initialize();

    if (points.length < 3) {
      throw new Error('Cannot form a boundary with less than three points');
    }

    // Clear existing points for this farm
    await databaseService.delete('boundary_points', 'farm_id = ?', [farmId]);

    // Insert new points
    for (const point of points) {
      await databaseService.insert('boundary_points', {
        farm_id: farmId,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: new Date().toISOString(),
        description: point.description || null,
        photo_uri: point.photoUri || null
      });
    }

    // Verify the points were saved
    const savedPoints = await databaseService.getAll(
      'boundary_points', 
      'farm_id = ?', 
      [farmId],
      'ORDER BY timestamp'
    );

    if (__DEV__) console.log(`Saved ${savedPoints.length} boundary points for farm ${farmId}`);
    
    // Update inspection observations for this farm
    try {
      // Get all inspection observations for this farm
      const observations = await getInspectionObservationsByFarmId(farmId);
      
      if (observations && observations.length > 0) {
        if (__DEV__) console.log(`Updating ${observations.length} inspection observations for farm ${farmId}`);
        
        // Get the farm details
        const farms = await getFarms();
        const farm = farms.find(f => f.id === Number(farmId));
        
        if (farm) {
          // Update each observation with the latest farm details
          for (const observation of observations) {
            await updateInspectionObservation(observation.id, {
              plant_per_section: farm.plant_type || farm.crop_type || 'Unknown',
              target_entity: farm.plant_type || farm.crop_type || 'Unknown',
              farm_name: farm.name || 'Unknown Farm',
              farm_size: farm.size || 0,
              farm_location: farm.location || 'Unknown Location',
              updated_at: new Date().toISOString()
            });
          }
          
          if (__DEV__) console.log('Successfully updated inspection observations with latest farm details');
        }
      }
    } catch (error) {
      // Log the error but don't fail the boundary save operation
      if (__DEV__) console.error('Error updating inspection observations:', error);
    }
    
    return savedPoints;
  } catch (error) {
    if (__DEV__) console.error('Error saving boundary data:', error);
    throw new Error(`Failed to save boundary points: ${error.message}`);
  }
};

/**
 * Get boundary data for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<Array>} - Boundary points
 */
export const getBoundaryData = async (farmId) => {
  try {
    await databaseService.initialize();
    
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Verify the farm exists
    const existingFarm = await databaseService.getById('farms', 'id', farmIdNum);
    
    if (!existingFarm) {
      if (__DEV__) console.warn('No farm found with ID:', farmIdNum);
      // Don't throw an error, just return empty array
      return [];
    }
    
    // Get boundary points
    const points = await databaseService.getAll(
      'boundary_points', 
      'farm_id = ?', 
      [farmIdNum],
      'ORDER BY timestamp'
    );
    
    if (__DEV__) console.log(`Found ${points.length} boundary points for farm ID ${farmIdNum}`);
    
    return points;
  } catch (error) {
    if (__DEV__) console.error('Error getting boundary data:', error);
    throw error;
  }
};

/**
 * Delete a farm and all associated data
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFarm = async (farmId) => {
  try {
    await databaseService.initialize();
    
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // First, verify the farm exists
    const existingFarm = await databaseService.getById('farms', 'id', farmIdNum);
    
    if (!existingFarm) {
      throw new Error('No farm found with the given ID');
    }
    
    // Begin transaction
    await databaseService.executeQuery('BEGIN TRANSACTION');
    
    // Delete all boundary points for this farm
    await databaseService.delete('boundary_points', 'farm_id = ?', [farmIdNum]);
    
    // Delete all observation points for this farm
    await databaseService.delete('observation_points', 'farm_id = ?', [farmIdNum]);
    
    // Delete all inspection suggestions for this farm
    try {
      if (__DEV__) console.log(`Deleting inspection suggestions for farm ${farmIdNum}`);
      const suggestions = await getInspectionSuggestionsByFarmId(farmIdNum);
      
      for (const suggestion of suggestions) {
        await deleteInspectionSuggestion(suggestion.id);
      }
    } catch (error) {
      if (__DEV__) console.error('Error deleting inspection suggestions:', error);
      // Continue with farm deletion even if suggestion deletion fails
    }
    
    // Delete all inspection observations for this farm
    try {
      if (__DEV__) console.log(`Deleting inspection observations for farm ${farmIdNum}`);
      const observations = await getInspectionObservationsByFarmId(farmIdNum);
      
      for (const observation of observations) {
        await updateInspectionObservation(observation.id, { status: 'deleted' });
      }
      
      // Also try to delete directly from the database table
      await databaseService.delete('inspection_observations', 'farm_id = ?', [farmIdNum]);
    } catch (error) {
      if (__DEV__) console.error('Error deleting inspection observations:', error);
      // Continue with farm deletion even if observation deletion fails
    }
    
    // Delete the farm
    await databaseService.delete('farms', 'id = ?', [farmIdNum]);
    
    // Commit transaction
    await databaseService.executeQuery('COMMIT');
    
    if (__DEV__) console.log(`Farm ${farmIdNum} and all associated data deleted successfully`);
    return true;
  } catch (error) {
    // Rollback transaction on error
    try {
      await databaseService.executeQuery('ROLLBACK');
    } catch (rollbackError) {
      if (__DEV__) console.error('Error during rollback:', rollbackError);
    }
    if (__DEV__) console.error('Error deleting farm:', error);
    throw new Error(`Failed to delete farm: ${error.message}`);
  }
};

/**
 * Update farm size
 * @param {number} farmId - Farm ID
 * @param {number} newSize - New farm size
 * @returns {Promise<Object>} - Updated farm
 */
export const updateFarmSize = async (farmId, newSize) => {
  try {
    await databaseService.initialize();
    
    // Convert to number explicitly
    const sizeValue = Number(newSize);
    
    // Update the farm size
    await databaseService.update('farms', { size: sizeValue }, 'id = ?', [farmId]);
    
    // Get the updated farm
    return await databaseService.getById('farms', 'id', farmId);
  } catch (error) {
    if (__DEV__) console.error('Error updating farm size:', error);
    throw new Error(`Failed to update farm size: ${error.message}`);
  }
};

/**
 * Update farm details
 * @param {number} farmId - Farm ID
 * @param {Object} farmData - Farm data to update
 * @returns {Promise<Object>} - Updated farm
 */
export const updateFarm = async (farmId, farmData) => {
  try {
    await databaseService.initialize();
    
    const { name, size, plant_type } = farmData;
    
    // First, verify the farm exists
    const existingFarm = await databaseService.getById('farms', 'id', farmId);
    
    if (!existingFarm) {
      throw new Error('No farm found with the given ID');
    }
    
    // Convert size to number
    const sizeValue = size !== null ? Number(size) : null;
    
    // Update the farm
    await databaseService.update(
      'farms',
      {
        name,
        size: sizeValue,
        plant_type
      },
      'id = ?',
      [farmId]
    );
    
    // Get the updated farm
    const updatedFarm = await databaseService.getById('farms', 'id', farmId);
    
    // Update inspection observations for this farm
    try {
      // Get all inspection observations for this farm
      const observations = await getInspectionObservationsByFarmId(farmId);
      
      if (observations && observations.length > 0) {
        if (__DEV__) console.log(`Updating ${observations.length} inspection observations for farm ${farmId}`);
        
        // Update each observation with the latest farm details
        for (const observation of observations) {
          await updateInspectionObservation(observation.id, {
            plant_per_section: plant_type || 'Unknown',
            target_entity: plant_type || 'Unknown',
            farm_name: name || 'Unknown Farm',
            farm_size: sizeValue || 0,
            updated_at: new Date().toISOString()
          });
        }
        
        if (__DEV__) console.log('Successfully updated inspection observations with latest farm details');
      }
    } catch (error) {
      // Log the error but don't fail the farm update operation
      if (__DEV__) console.error('Error updating inspection observations:', error);
    }
    
    return updatedFarm;
  } catch (error) {
    if (__DEV__) console.error('Error in updateFarm:', error);
    throw new Error(`Failed to update farm: ${error.message}`);
  }
};

/**
 * Update a boundary point
 * @param {number} pointId - Point ID
 * @param {string} description - New description
 * @returns {Promise<boolean>} - Success status
 */
export const updateBoundaryPoint = async (pointId, description) => {
  try {
    await databaseService.initialize();
    
    // Update the boundary point
    await databaseService.update(
      'boundary_points',
      { description },
      'id = ?',
      [pointId]
    );

    return true;
  } catch (error) {
    if (__DEV__) console.error('Error updating boundary point:', error);
    throw error;
  }
};

/**
 * Delete all boundary points for a farm
 * @param {number} farmId - Farm ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteAllBoundaryPoints = async (farmId) => {
  try {
    await databaseService.initialize();
    
    await databaseService.delete('boundary_points', 'farm_id = ?', [farmId]);
    return true;
  } catch (error) {
    if (__DEV__) console.error('Error deleting boundary points:', error);
    throw error;
  }
};

/**
 * Save a single boundary point
 * @param {number} farmId - Farm ID
 * @param {Object} point - Boundary point data
 * @returns {Promise<Object>} - Saved boundary point
 */
export const saveBoundaryPoint = async (farmId, point) => {
  try {
    await databaseService.initialize();
    
    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    
    // Verify the farm exists
    const existingFarm = await databaseService.getById('farms', 'id', farmIdNum);
    
    if (!existingFarm) {
      throw new Error(`No farm found with ID: ${farmIdNum}`);
    }

    // Insert the new point
    const pointId = await databaseService.insert('boundary_points', {
      farm_id: farmIdNum,
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp || new Date().toISOString(),
      description: point.description || null,
      photo_uri: point.photoUri || null
    });

    // Get the newly inserted point
    return await databaseService.getById('boundary_points', 'id', pointId);
  } catch (error) {
    if (__DEV__) console.error('Error saving boundary point:', error);
    throw error;
  }
};
