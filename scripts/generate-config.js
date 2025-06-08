const fs = require('fs');
const path = require('path');
require('dotenv').config();

const toBool = (value) => {
  return value === 'true' || value === '1';
};

const toNumber = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};
const config = {
  api: {
    baseUrl: process.env.BASE_API_URL || 'https://harvest.randytech.top',
    timeout: toNumber(process.env.API_TIMEOUT, 10000),
    endpoints: {
      login: '/api/auth/login/',
      logout: '/api/auth/logout/',
      register: '/api/auth/register/',
      tokenRefresh: '/api/auth/token/refresh/',
      userInfo: '/api/auth/me/',
      farms: '/api/farms/',
      boundaryPoints: '/api/boundary-points/',
      observationPoints: '/api/observation-points/',
      inspectionSuggestions: '/api/inspection-suggestions/',
      inspectionObservations: '/api/inspection-observations/',
      syncData: '/api/sync-data/',
      jwtVerify: '/api/accounts/jwt/verify/',
      profileSync: '/api/profile/profile/sync/',
    }
  },
  db: {
    name: process.env.DB_NAME || 'mobile.db'
  },
  auth: {
    tokenExpiryDays: toNumber(process.env.AUTH_TOKEN_EXPIRY_DAYS, 7),
    tokenPrefix: process.env.AUTH_TOKEN_PREFIX || 'JWT',
    storageKeys: {
      accessToken: 'harvestguard_access_token',
      refreshToken: 'harvestguard_refresh_token',
      userCredentials: 'harvestguard_user_credentials',
      lastSyncTime: 'harvestguard_last_sync_time',
    }
  },
  features: {
    deleteFarm: toBool(process.env.FEATURE_DELETE_FARM),
    syncData: toBool(process.env.FEATURE_SYNC_DATA)
  },
  app: {
    name: process.env.APP_NAME || 'Harvest Guard',
    version: process.env.APP_VERSION || '1.0.0',
    defaultUserId: toNumber(process.env.DEFAULT_USER_ID, 1)
  }
};

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
  return true;
}
function generateConfigFile(filePath, config) {
  try {
    ensureDirectoryExistence(filePath);

    const configContent = `
// Auto generated file, do not modify
export const config = ${JSON.stringify(config, null, 2)};
export default config;
`;

    fs.writeFileSync(filePath, configContent);
    console.log('Config file generated:', filePath);
  } catch (error) {
    console.error('Error on generate config files:', error);
  }
}

// Writing configs
const configPath = path.resolve(__dirname, '../config/env.js');
const configContent = `
// Auto generated file, do not modify
export const config = ${JSON.stringify(config, null, 2)};
export default config;
`;
generateConfigFile(configPath, config);
console.log('Config file generated:', configPath);