/**
 * Script to delete all inspection observations from the database
 */
import config from '@/config/env';
const SQLite = require('expo-sqlite');

// Open the database
const db = SQLite.openDatabase(config.db.name);

// Function to delete all inspection observations
const deleteAllObservations = async () => {
  return new Promise((resolve, reject) => {
    console.log('Starting deletion of all inspection observations...');

    // Delete all inspection observations
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM inspection_observations',
        [],
        (_, result) => {
          console.log(`Deleted ${result.rowsAffected} inspection observations`);
          resolve(result.rowsAffected);
        },
        (_, error) => {
          console.error('Error deleting inspection observations:', error);
          reject(error);
        }
      );
    });
  });
};

// Execute the deletion
deleteAllObservations()
  .then(count => {
    console.log(`Successfully deleted ${count} inspection observations`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to delete inspection observations:', error);
    process.exit(1);
  });
