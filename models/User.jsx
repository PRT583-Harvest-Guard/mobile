/**
 * User Model
 * Represents a user in the database
 */
import databaseService from '@/services/DatabaseService';

class User {
  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password_hash = data.password_hash || '';
    this.first_name = data.first_name || '';
    this.last_name = data.last_name || '';
    this.avatar_url = data.avatar_url || '';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Save the user to the database
   * @returns {Promise<number>} The ID of the saved user
   */
  async save() {
    try {
      const data = {
        username: this.username,
        email: this.email,
        password_hash: this.password_hash,
        first_name: this.first_name,
        last_name: this.last_name,
        avatar_url: this.avatar_url,
        updated_at: new Date().toISOString()
      };

      if (this.user_id) {
        // Update existing user
        await databaseService.update(
          'Users',
          data,
          'user_id = ?',
          [this.user_id]
        );
        return this.user_id;
      } else {
        // Insert new user
        data.created_at = new Date().toISOString();
        this.user_id = await databaseService.insert('Users', data);
        return this.user_id;
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Load a user from the database
   * @param {number} id - The ID of the user to load
   * @returns {Promise<User|null>} The loaded user or null if not found
   */
  static async findById(id) {
    try {
      const data = await databaseService.getById('Users', 'user_id', id);
      return data ? new User(data) : null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  /**
   * Find a user by username
   * @param {string} username - The username to search for
   * @returns {Promise<User|null>} The found user or null if not found
   */
  static async findByUsername(username) {
    try {
      const users = await databaseService.getAll(
        'Users',
        'username = ?',
        [username]
      );
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param {string} email - The email to search for
   * @returns {Promise<User|null>} The found user or null if not found
   */
  static async findByEmail(email) {
    try {
      const users = await databaseService.getAll(
        'Users',
        'email = ?',
        [email]
      );
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Delete the user from the database
   * @returns {Promise<number>} Number of rows affected
   */
  async delete() {
    try {
      if (!this.user_id) {
        throw new Error('Cannot delete unsaved user');
      }
      return await databaseService.delete(
        'Users',
        'user_id = ?',
        [this.user_id]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all properties for this user
   * @returns {Promise<Array<Object>>} Array of properties
   */
  async getProperties() {
    try {
      if (!this.user_id) {
        throw new Error('Cannot get properties for unsaved user');
      }
      return await databaseService.getAll(
        'Properties',
        'user_id = ?',
        [this.user_id]
      );
    } catch (error) {
      console.error('Error getting user properties:', error);
      throw error;
    }
  }

  /**
   * Get all inspection records for this user
   * @returns {Promise<Array<Object>>} Array of inspection records
   */
  async getInspectionRecords() {
    try {
      if (!this.user_id) {
        throw new Error('Cannot get inspection records for unsaved user');
      }
      return await databaseService.getAll(
        'InspectionRecords',
        'user_id = ?',
        [this.user_id]
      );
    } catch (error) {
      console.error('Error getting user inspection records:', error);
      throw error;
    }
  }
}

export default User; 