/**
 * Script to find unused functions in the codebase
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of service files to check
const serviceFiles = [
  'services/BoundaryService.js',
  'services/InspectionObservationService.js',
  'services/ObservationService.js',
  'services/ObservationRecordService.js',
  'services/FeatureFlagService.js',
  'services/ProfileService.js'
];

// Function to extract exported functions from a file
function extractExportedFunctions(filePath) {
  try {
    console.log(`Reading file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const exportRegex = /export\s+const\s+(\w+)\s*=/g;
    const functions = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    console.log(`Found ${functions.length} exported functions in ${filePath}`);
    console.log(`Functions: ${functions.join(', ')}`);
    
    return functions;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Function to check if a function is used in the codebase
function isFunctionUsed(functionName, sourceFile) {
  try {
    console.log(`Checking usage of function: ${functionName}`);
    
    // Exclude the source file itself from the search
    const grepCommand = `grep -r "${functionName}" --include="*.js" --include="*.jsx" . | grep -v "${sourceFile}"`;
    console.log(`Running command: ${grepCommand}`);
    
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    // If grep returns results, the function is used
    const isUsed = result.trim().length > 0;
    console.log(`Function ${functionName} is ${isUsed ? 'used' : 'NOT USED'}`);
    
    return isUsed;
  } catch (error) {
    // grep returns non-zero exit code if no matches found
    console.log(`Function ${functionName} is NOT USED (grep returned no results)`);
    return false;
  }
}

// Main function to find unused functions
function findUnusedFunctions() {
  console.log('Checking for unused functions in service files...\n');
  
  let totalUnused = 0;
  
  for (const serviceFile of serviceFiles) {
    console.log(`\n=== Checking ${serviceFile} ===`);
    
    const exportedFunctions = extractExportedFunctions(serviceFile);
    const unusedFunctions = [];
    
    for (const functionName of exportedFunctions) {
      if (!isFunctionUsed(functionName, serviceFile)) {
        unusedFunctions.push(functionName);
        totalUnused++;
      }
    }
    
    if (unusedFunctions.length > 0) {
      console.log(`\nFound ${unusedFunctions.length} unused functions in ${serviceFile}:`);
      unusedFunctions.forEach(func => console.log(`  - ${func}`));
    } else {
      console.log(`\nNo unused functions found in ${serviceFile}.`);
    }
    
    console.log('\n' + '-'.repeat(50)); // Separator for readability
  }
  
  console.log(`\nTotal unused functions found: ${totalUnused}`);
}

// Run the function
try {
  findUnusedFunctions();
} catch (error) {
  console.error('Error running script:', error);
}
