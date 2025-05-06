/**
 * Inspection Suggestion Model
 * Represents an inspection suggestion in the database
 */
import databaseService from '@/services/DatabaseService';

class InspectionSuggestion {
  constructor(data = {}) {
    this.id = data.id || null;
    this.target_entity = data.target_entity || '';
    this.confidence_level = data.confidence_level || '';
    this.property_location = data.property_location || null; // farm_id
    this.area_size = data.area_size || 0;
    this.density_of_plant = data.density_of_plant || 0;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Save the inspection suggestion to the database
   * @returns {Promise<number>} The ID of the saved suggestion
   */
  async save() {
    try {
      const data = {
        target_entity: this.target_entity,
        confidence_level: this.confidence_level,
        property_location: this.property_location,
        area_size: this.area_size,
        density_of_plant: this.density_of_plant,
        updated_at: new Date().toISOString()
      };

      if (this.id) {
        // Update existing suggestion
        await databaseService.update(
          'InspectionSuggestions',
          data,
          'id = ?',
          [this.id]
        );
        return this.id;
      } else {
        // Insert new suggestion
        data.created_at = new Date().toISOString();
        this.id = await databaseService.insert('InspectionSuggestions', data);
        return this.id;
      }
    } catch (error) {
      console.error('Error saving inspection suggestion:', error);
      throw error;
    }
  }

  /**
   * Load an inspection suggestion from the database
   * @param {number} id - The ID of the inspection suggestion to load
   * @returns {Promise<InspectionSuggestion|null>} The loaded inspection suggestion or null if not found
   */
  static async findById(id) {
    try {
      const data = await databaseService.getById('InspectionSuggestions', 'id', id);
      return data ? new InspectionSuggestion(data) : null;
    } catch (error) {
      console.error('Error finding inspection suggestion:', error);
      throw error;
    }
  }

  /**
   * Get all inspection suggestions
   * @returns {Promise<Array<InspectionSuggestion>>} Array of inspection suggestions
   */
  static async findAll() {
    try {
      const suggestions = await databaseService.getAll('InspectionSuggestions');
      return suggestions.map(suggestion => new InspectionSuggestion(suggestion));
    } catch (error) {
      console.error('Error finding inspection suggestions:', error);
      throw error;
    }
  }

  /**
   * Get all inspection suggestions for a farm
   * @param {number} farmId - The ID of the farm
   * @returns {Promise<Array<InspectionSuggestion>>} Array of inspection suggestions
   */
  static async findByFarmId(farmId) {
    try {
      const suggestions = await databaseService.getAll(
        'InspectionSuggestions',
        'property_location = ?',
        [farmId]
      );
      return suggestions.map(suggestion => new InspectionSuggestion(suggestion));
    } catch (error) {
      console.error('Error finding inspection suggestions:', error);
      throw error;
    }
  }

  /**
   * Delete the inspection suggestion from the database
   * @returns {Promise<number>} Number of rows affected
   */
  async delete() {
    try {
      if (!this.id) {
        throw new Error('Cannot delete unsaved inspection suggestion');
      }
      return await databaseService.delete(
        'InspectionSuggestions',
        'id = ?',
        [this.id]
      );
    } catch (error) {
      console.error('Error deleting inspection suggestion:', error);
      throw error;
    }
  }

  /**
   * Initialize the InspectionSuggestions table in the database
   * @returns {Promise<void>}
   */
  static async initTable() {
    try {
      // Make sure the database service is initialized
      if (!databaseService.initialized) {
        await databaseService.initialize();
      }
      
      // Create the table if it doesn't exist
      await databaseService.executeQuery(`
        CREATE TABLE IF NOT EXISTS InspectionSuggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_entity TEXT NOT NULL,
          confidence_level TEXT NOT NULL,
          property_location INTEGER,
          area_size REAL NOT NULL,
          density_of_plant INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('InspectionSuggestions table initialized');
    } catch (error) {
      console.error('Error initializing InspectionSuggestions table:', error);
      // Log the error but don't throw to prevent app crashes
      console.error(error);
    }
  }
}

export default InspectionSuggestion;
