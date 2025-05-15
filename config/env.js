import {
  API_BASE_URL,
  API_TIMEOUT,
  DB_NAME,
  AUTH_TOKEN_EXPIRY_DAYS,
  AUTH_TOKEN_PREFIX,
  FEATURE_DELETE_FARM,
  FEATURE_SYNC_DATA,
  APP_NAME,
  APP_VERSION,
  DEFAULT_USER_ID
} from '@env';

const toBool = (value) => {
  return value === 'true' || value === '1';
};

const toNumber = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const config = {
  api: {
    baseUrl: API_BASE_URL || 'http://localhost:8001',
    timeout: toNumber(API_TIMEOUT, 10000),
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
    }
  },
  db: {
    name: DB_NAME || 'mobile.db'
  },
  auth: {
    tokenExpiryDays: toNumber(AUTH_TOKEN_EXPIRY_DAYS, 7),
    tokenPrefix: AUTH_TOKEN_PREFIX || 'JWT',
    storageKeys: {
      accessToken: 'harvestguard_access_token',
      refreshToken: 'harvestguard_refresh_token',
      userCredentials: 'harvestguard_user_credentials',
      lastSyncTime: 'harvestguard_last_sync_time',
    }
  },
  features: {
    deleteFarm: toBool(FEATURE_DELETE_FARM),
    syncData: toBool(FEATURE_SYNC_DATA)
  },
  app: {
    name: APP_NAME || 'Harvest Guard',
    version: APP_VERSION || '1.0.0',
    defaultUserId: toNumber(DEFAULT_USER_ID, 1)
  }
};

export default config;