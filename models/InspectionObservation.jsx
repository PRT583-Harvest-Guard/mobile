/**
 * Inspection Observation Model
 * Represents an inspection observation in the database
 */
import databaseService from '@/services/DatabaseService';

class InspectionObservation {
  constructor(data = {}) {
    this.id = data.id || null;
    this.date = data.date || new Date().toISOString();
    this.inspection_id = data.inspection_id || null;
    this.confidence = data.confidence || '';
    this.section_id = data.section_id || null; // observation_id
    this.farm_id = data.farm_id || null;
    this.plant_per_section = data.plant_per_section || ''; // farm_crop_type
    this.status = data.status || 'pending'; // pending, completed, cancelled
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Save the inspection observation to the database
   * @returns {Promise<number>} The ID of the saved observation
   */
  async save() {
    try {
      const data = {
        date: this.date,
        inspection_id: this.inspection_id,
        confidence: this.confidence,
        section_id: this.section_id,
        farm_id: this.farm_id,
        plant_per_section: this.plant_per_section,
        status: this.status,
        updated_at: new Date().toISOString()
      };

      if (this.id) {
        // Update existing observation
        await databaseService.update(
          'InspectionObservations',
          data,
          'id = ?',
          [this.id]
        );
        return this.id;
      } else {
        // Insert new observation
        data.created_at = new Date().toISOString();
        this.id = await databaseService.insert('InspectionObservations', data);
        return this.id;
      }
    } catch (error) {
      console.error('Error saving inspection observation:', error);
      throw error;
    }
  }

  /**
   * Load an inspection observation from the database
   * @param {number} id - The ID of the inspection observation to load
   * @returns {Promise<InspectionObservation|null>} The loaded inspection observation or null if not found
   */
  static async findById(id) {
    try {
      const data = await databaseService.getById('InspectionObservations', 'id', id);
      return data ? new InspectionObservation(data) : null;
    } catch (error) {
      console.error('Error finding inspection observation:', error);
      throw error;
    }
  }

  /**
   * Get all inspection observations
   * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
   */
  static async findAll() {
    try {
      const observations = await databaseService.getAll('InspectionObservations');
      return observations.map(observation => new InspectionObservation(observation));
    } catch (error) {
      console.error('Error finding inspection observations:', error);
      throw error;
    }
  }

  /**
   * Get all inspection observations for an inspection
   * @param {number} inspectionId - The ID of the inspection
   * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
   */
  static async findByInspectionId(inspectionId) {
    try {
      const observations = await databaseService.getAll(
        'InspectionObservations',
        'inspection_id = ?',
        [inspectionId]
      );
      return observations.map(observation => new InspectionObservation(observation));
    } catch (error) {
      console.error('Error finding inspection observations:', error);
      throw error;
    }
  }

  /**
   * Get all inspection observations for a farm
   * @param {number} farmId - The ID of the farm
   * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
   */
  static async findByFarmId(farmId) {
    try {
      const observations = await databaseService.getAll(
        'InspectionObservations',
        'farm_id = ?',
        [farmId]
      );
      return observations.map(observation => new InspectionObservation(observation));
    } catch (error) {
      console.error('Error finding inspection observations for farm:', error);
      throw error;
    }
  }

  /**
   * Get all inspection observations by status
   * @param {string} status - The status to filter by (pending, completed, cancelled)
   * @returns {Promise<Array<InspectionObservation>>} Array of inspection observations
   */
  static async findByStatus(status) {
    try {
      const observations = await databaseService.getAll(
        'InspectionObservations',
        'status = ?',
        [status]
      );
      return observations.map(observation => new InspectionObservation(observation));
    } catch (error) {
      console.error('Error finding inspection observations by status:', error);
      throw error;
    }
  }

  /**
   * Delete the inspection observation from the database
   * @returns {Promise<number>} Number of rows affected
   */
  async delete() {
    try {
      if (!this.id) {
        throw new Error('Cannot delete unsaved inspection observation');
      }
      return await databaseService.delete(
        'InspectionObservations',
        'id = ?',
        [this.id]
      );
    } catch (error) {
      console.error('Error deleting inspection observation:', error);
      throw error;
    }
  }

  /**
   * Initialize the InspectionObservations table in the database
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
        CREATE TABLE IF NOT EXISTS InspectionObservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          inspection_id INTEGER,
          confidence TEXT NOT NULL,
          section_id INTEGER,
          farm_id INTEGER,
          plant_per_section TEXT,
          status TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('InspectionObservations table initialized');
    } catch (error) {
      console.error('Error initializing InspectionObservations table:', error);
      // Log the error but don't throw to prevent app crashes
      console.error(error);
    }
  }
}

export default InspectionObservation;
