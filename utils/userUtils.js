/**
 * User Utilities
 * Provides consistent methods for getting current user information
 */
import apiAuthService from '@/services/ApiAuthService';
import AuthService from '@/services/AuthService';

/**
 * Get the current local user ID from the stored credentials
 * This ensures consistency across the app for user-specific data filtering
 * @returns {Promise<number|null>} Local user ID or null
 */
export const getCurrentLocalUserId = async () => {
  try {
    // Get stored credentials from the auth service
    const credentials = await apiAuthService.getStoredCredentials();
    
    if (!credentials || !credentials.username) {
      console.log('No stored credentials available to get local user ID');
      return null;
    }

    // Find the user in the local database by username
    const user = await AuthService.findUserByUsername(credentials.username);
    
    if (user && user.id) {
      console.log('Current local user ID:', user.id);
      return user.id;
    }

    console.log('No local user found for username:', credentials.username);
    return null;
  } catch (error) {
    console.error('Error getting current local user ID:', error);
    return null;
  }
};

/**
 * Get the current user information from stored credentials
 * @returns {Promise<Object|null>} User object or null
 */
export const getCurrentLocalUser = async () => {
  try {
    // Get stored credentials from the auth service
    const credentials = await apiAuthService.getStoredCredentials();
    
    if (!credentials || !credentials.username) {
      console.log('No stored credentials available to get local user');
      return null;
    }

    // Find the user in the local database by username
    const user = await AuthService.findUserByUsername(credentials.username);
    
    if (user) {
      console.log('Current local user:', user.username);
      return user;
    }

    console.log('No local user found for username:', credentials.username);
    return null;
  } catch (error) {
    console.error('Error getting current local user:', error);
    return null;
  }
};
