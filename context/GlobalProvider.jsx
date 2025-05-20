import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    isAuthenticated: false,
    isAuthenticating: false,
    isSyncing: false,
    progress: 0,
    currentStep: '',
    error: null,
    lastSyncTime: null
  });

  // Save user credentials for later use
  const saveUserCredentials = async (credentials) => {
    try {
      // Store only username and password, not the sessionToken
      const apiCredentials = {
        username: credentials.username,
        password: credentials.password
      };
      
      await AsyncStorage.setItem('userCredentials', JSON.stringify(apiCredentials));
      setUserCredentials(apiCredentials);
    } catch (error) {
      console.error('Error saving user credentials:', error);
    }
  };

  // Update sync status
  const updateSyncStatus = (newStatus) => {
    setSyncStatus(prevStatus => ({
      ...prevStatus,
      ...newStatus
    }));
  };

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        // Get session token
        const sessionToken = await AsyncStorage.getItem('sessionToken');
        
        if (sessionToken) {
          setIsLoggedIn(true);
          
          // Get user credentials
          const credentialsJson = await AsyncStorage.getItem('userCredentials');
          
          if (credentialsJson) {
            setUserCredentials(JSON.parse(credentialsJson));
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    
    checkLoginStatus();
  }, []);

  return (
    <GlobalContext.Provider
    value={{
      isLoggedIn, 
      setIsLoggedIn, 
      isLoading,
      userCredentials,
      saveUserCredentials,
      syncStatus,
      updateSyncStatus
    }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export default GlobalProvider;
