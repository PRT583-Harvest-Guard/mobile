/**
 * Script to delete all inspection suggestions and their associated observations
 * 
 * This script will:
 * 1. Delete all inspection observations
 * 2. Delete all inspection suggestions
 * 3. Log the results
 */

import databaseService from '../services/DatabaseService';
import { 
  getInspectionSuggestions,
  deleteInspectionSuggestion 
} from '../services/InspectionSuggestionService';
import {
  getInspectionObservations,
  deleteInspectionObservation
} from '../services/InspectionObservationService';

/**
 * Delete all inspection suggestions and their associated observations
 */
async function deleteAllSuggestions() {
  try {
    console.log('Starting deletion of all inspection suggestions and observations...');
    
    // Initialize the database service
    await databaseService.initialize();
    
    // Get all inspection observations
    console.log('Getting all inspection observations...');
    const observations = await getInspectionObservations();
    console.log(`Found ${observations.length} inspection observations`);
    
    // Delete all inspection observations
    console.log('Deleting all inspection observations...');
    for (const observation of observations) {
      try {
        await deleteInspectionObservation(observation.id);
        console.log(`Deleted observation with ID: ${observation.id}`);
      } catch (error) {
        console.error(`Error deleting observation with ID ${observation.id}:`, error);
      }
    }
    
    // Get all inspection suggestions
    console.log('Getting all inspection suggestions...');
    const suggestions = await getInspectionSuggestions();
    console.log(`Found ${suggestions.length} inspection suggestions`);
    
    // Delete all inspection suggestions
    console.log('Deleting all inspection suggestions...');
    for (const suggestion of suggestions) {
      try {
        await deleteInspectionSuggestion(suggestion.id);
        console.log(`Deleted suggestion with ID: ${suggestion.id}`);
      } catch (error) {
        console.error(`Error deleting suggestion with ID ${suggestion.id}:`, error);
      }
    }
    
    // Verify deletion
    const remainingObservations = await getInspectionObservations();
    const remainingSuggestions = await getInspectionSuggestions();
    
    console.log(`Deletion complete. Remaining observations: ${remainingObservations.length}, remaining suggestions: ${remainingSuggestions.length}`);
    
    // Reset the database tables using SQL-like queries
    console.log('Resetting database tables...');
    
    try {
      // Use the database service to clear the tables
      await databaseService.executeQuery('DELETE FROM InspectionObservations');
      await databaseService.executeQuery('DELETE FROM InspectionSuggestions');
      console.log('Database tables cleared using SQL queries');
    } catch (error) {
      console.error('Error clearing database tables:', error);
      
      // Alternative approach: delete each record individually
      console.log('Trying alternative approach: deleting each record individually');
      
      // Get all remaining observations and delete them
      const remainingObservations = await getInspectionObservations();
      for (const observation of remainingObservations) {
        await deleteInspectionObservation(observation.id);
      }
      
      // Get all remaining suggestions and delete them
      const remainingSuggestions = await getInspectionSuggestions();
      for (const suggestion of remainingSuggestions) {
        await deleteInspectionSuggestion(suggestion.id);
      }
      
      console.log('Alternative deletion approach completed');
    }
    
    console.log('All inspection suggestions and observations have been deleted');
  } catch (error) {
    console.error('Error deleting suggestions and observations:', error);
  }
}

// Execute the function
deleteAllSuggestions()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error));
