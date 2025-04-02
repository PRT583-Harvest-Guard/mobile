import { createContext, useContext, useEffect, useState } from "react";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  useEffect(() => {}, []);

  return (
    <GlobalContext.Provider
    value={{
      isLoggedIn, 
      setIsLoggedIn, 
      isLoading
    }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export default GlobalProvider;