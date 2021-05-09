import React, { useState } from 'react'

const MainContext = React.createContext();

const MainProvider = ({ children }) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [host, setHost] = useState(undefined);

  return (
    <MainContext.Provider value={{ name, room, setName, setRoom }}>
        {children}
    </MainContext.Provider>
  );
};

export { MainContext, MainProvider };