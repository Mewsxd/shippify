import { createContext, useState } from "react";

const MainContext = createContext({});
export default MainContext;

export const MainContextProvider = ({ children }) => {
  const [userData, setUserData] = useState();
  return (
    <MainContext.Provider value={{ userData, setUserData }}>
      {children}
    </MainContext.Provider>
  );
};
