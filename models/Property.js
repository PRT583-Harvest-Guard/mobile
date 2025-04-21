/**
 * Property Model
 * Represents a property in the database
 */
import databaseService from '@/services/DatabaseService';

class Property {
  constructor(data = {}) {
    this.property_id = data.property_id || null;
    this.user_id = data.user_id || null;
    this.name = data.name || '';
    this.location = data.location || '';
    this.area_size = data.area_size || 0;
    this.plant_density = data.plant_density || 0;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Save the property to the database
   * @returns {Promise<number>} The ID of the saved property
   */
  async save() {
    try {
      const data = {
        user_id: this.user_id,
        name: this.name,
        location: this.location,
        area_size: this.area_size,
        plant_density: this.plant_density,
        updated_at: new Date().toISOString()
      };

      if (this.property_id) {
        // Update existing property
        await databaseService.update(
          'Properties',
          data,
          'property_id = ?',
          [this.property_id]
        );
        return this.property_id;
      } else {
        // Insert new property
        data.created_at = new Date().toISOString();
        this.property_id = await databaseService.insert('Properties', data);
        return this.property_id;
      }
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  }

  /**
   * Load a property from the database
   * @param {number} id - The ID of the property to load
   * @returns {Promise<Property|null>} The loaded property or null if not found
   */
  static async findById(id) {
    try {
      const data = await databaseService.getById('Properties', 'property_id', id);
      return data ? new Property(data) : null;
    } catch (error) {
      console.error('Error finding property:', error);
      throw error;
    }
  }

  /**
   * Get all properties for a user
   * @param {number} userId - The ID of the user
   * @returns {Promise<Array<Property>>} Array of properties
   */
  static async findByUserId(userId) {
    try {
      const properties = await databaseService.getAll(
        'Properties',
        'user_id = ?',
        [userId]
      );
      return properties.map(property => new Property(property));
    } catch (error) {
      console.error('Error finding properties:', error);
      throw error;
    }
  }

  /**
   * Delete the property from the database
   * @returns {Promise<number>} Number of rows affected
   */
  async delete() {
    try {
      if (!this.property_id) {
        throw new Error('Cannot delete unsaved property');
      }
      return await databaseService.delete(
        'Properties',
        'property_id = ?',
        [this.property_id]
      );
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  /**
   * Get all photos for this property
   * @returns {Promise<Array<Object>>} Array of property photos
   */
  async getPhotos() {
    try {
      if (!this.property_id) {
        throw new Error('Cannot get photos for unsaved property');
      }
      return await databaseService.getAll(
        'PropertyPhotos',
        'property_id = ?',
        [this.property_id]
      );
    } catch (error) {
      console.error('Error getting property photos:', error);
      throw error;
    }
  }

  /**
   * Add a photo to this property
   * @param {Object} photoData - The photo data to add
   * @returns {Promise<number>} The ID of the saved photo
   */
  async addPhoto(photoData) {
    try {
      if (!this.property_id) {
        throw new Error('Cannot add photo to unsaved property');
      }
      const data = {
        property_id: this.property_id,
        photo_uri: photoData.photo_uri,
        latitude: photoData.latitude,
        longitude: photoData.longitude,
        description: photoData.description,
        created_at: new Date().toISOString()
      };
      return await databaseService.insert('PropertyPhotos', data);
    } catch (error) {
      console.error('Error adding property photo:', error);
      throw error;
    }
  }
}

export default Property; 