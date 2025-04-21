/**
 * Inspection Record Model
 * Represents an inspection record in the database
 */
import databaseService from '@/services/DatabaseService';

class InspectionRecord {
  constructor(data = {}) {
    this.inspection_id = data.inspection_id || null;
    this.user_id = data.user_id || null;
    this.property_id = data.property_id || null;
    this.entity_id = data.entity_id || null;
    this.confidence_id = data.confidence_id || null;
    this.inspection_date = data.inspection_date || new Date().toISOString();
    this.inspection_sections = data.inspection_sections || 0;
    this.plants_per_section = data.plants_per_section || 0;
    this.is_finished = data.is_finished || false;
    this.is_synced = data.is_synced || false;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Save the inspection record to the database
   * @returns {Promise<number>} The ID of the saved record
   */
  async save() {
    try {
      const data = {
        user_id: this.user_id,
        property_id: this.property_id,
        entity_id: this.entity_id,
        confidence_id: this.confidence_id,
        inspection_date: this.inspection_date,
        inspection_sections: this.inspection_sections,
        plants_per_section: this.plants_per_section,
        is_finished: this.is_finished ? 1 : 0,
        is_synced: this.is_synced ? 1 : 0,
        updated_at: new Date().toISOString()
      };

      if (this.inspection_id) {
        // Update existing record
        await databaseService.update(
          'InspectionRecords',
          data,
          'inspection_id = ?',
          [this.inspection_id]
        );
        return this.inspection_id;
      } else {
        // Insert new record
        data.created_at = new Date().toISOString();
        this.inspection_id = await databaseService.insert('InspectionRecords', data);
        return this.inspection_id;
      }
    } catch (error) {
      console.error('Error saving inspection record:', error);
      throw error;
    }
  }

  /**
   * Load an inspection record from the database
   * @param {number} id - The ID of the inspection record to load
   * @returns {Promise<InspectionRecord|null>} The loaded inspection record or null if not found
   */
  static async findById(id) {
    try {
      const data = await databaseService.getById('InspectionRecords', 'inspection_id', id);
      return data ? new InspectionRecord(data) : null;
    } catch (error) {
      console.error('Error finding inspection record:', error);
      throw error;
    }
  }

  /**
   * Get all inspection records for a user
   * @param {number} userId - The ID of the user
   * @returns {Promise<Array<InspectionRecord>>} Array of inspection records
   */
  static async findByUserId(userId) {
    try {
      const records = await databaseService.getAll(
        'InspectionRecords',
        'user_id = ?',
        [userId]
      );
      return records.map(record => new InspectionRecord(record));
    } catch (error) {
      console.error('Error finding inspection records:', error);
      throw error;
    }
  }

  /**
   * Get all inspection records for a property
   * @param {number} propertyId - The ID of the property
   * @returns {Promise<Array<InspectionRecord>>} Array of inspection records
   */
  static async findByPropertyId(propertyId) {
    try {
      const records = await databaseService.getAll(
        'InspectionRecords',
        'property_id = ?',
        [propertyId]
      );
      return records.map(record => new InspectionRecord(record));
    } catch (error) {
      console.error('Error finding inspection records:', error);
      throw error;
    }
  }

  /**
   * Delete the inspection record from the database
   * @returns {Promise<number>} Number of rows affected
   */
  async delete() {
    try {
      if (!this.inspection_id) {
        throw new Error('Cannot delete unsaved inspection record');
      }
      return await databaseService.delete(
        'InspectionRecords',
        'inspection_id = ?',
        [this.inspection_id]
      );
    } catch (error) {
      console.error('Error deleting inspection record:', error);
      throw error;
    }
  }
}

export default InspectionRecord; 