import AsyncStorage from '@react-native-async-storage/async-storage';

export default async function initStuff(): Promise<boolean> {
  try {
    // 1. could perform DB init, permissions check Remote Config etc.
    // await someDatabaseMigration();
    // await registerForPushNotifications();


    // 2. check if user login already
    const token = await AsyncStorage.getItem('sessionToken');
    console.log('token:', token);
    return Boolean(token);
  } catch (err) {
    console.warn('[initStuff] startup error:', err);
    return false;
  }
}
