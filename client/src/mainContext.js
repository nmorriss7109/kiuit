import React, { useState } from 'react'

const MainContext = React.createContext();

const MainProvider = ({ children }) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  // const [host, setHost] = useState(undefined);
  const [sessionId, setSessionId] = useState('')

  return (
    <MainContext.Provider value={{ name, room, sessionId, setName, setRoom, setSessionId }}>
        {children}
    </MainContext.Provider>
  );
};

export { MainContext, MainProvider };