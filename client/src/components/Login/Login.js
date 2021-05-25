import React, { useContext, useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { MainContext } from '../../mainContext'
import { SocketContext } from '../../socketContext'
import { Flex, Heading, IconButton, Input } from "@chakra-ui/react"
import { RiArrowRightLine } from "react-icons/ri"
import { useToast } from "@chakra-ui/react"
import { UsersContext } from '../../usersContext'
import { v4 as uuidv4 } from 'uuid'

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const Login = () => {
  const socket = useContext(SocketContext)
  const { name, room, sessionId, setName, setRoom, setSessionId } = useContext(MainContext)
  const history = useHistory()
  const toast = useToast()
  const { setUsers } = useContext(UsersContext)

  //Checks to see if there's a user already present
  useEffect(() => {
    socket.on("users", users => {
      setUsers(users);
    });

    //If there is a cookie already storing a sessionId, use that instead of asking user to login again
    if (getCookie('sessionId') != undefined) {
      const sessionId = getCookie('sessionId');
      setSessionId(sessionId);
      // const name = getCookie('name');
      // const room = getCookie('room');
      
      // setName(name);
      // setRoom(room);

      socket.emit('resume_session', { sessionId }, callback => {

        // TODO: Fix this stuff
        if (typeof callback == Error) {
          console.log("right here");
          return toast({
            position: "top",
            title: "Error",
            description: callback.error,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        
        setName(callback.name);
        setRoom(callback.room_name);
        history.push('/queue');
        return toast({
          position: "top",
          title: "Hey there",
          description: `Welcome to ${callback.room_name}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, []);

  //Emits the login event and if successful redirects to queue and saves user data
  const handleClick = () => {
    const sessionId = uuidv4();
    document.cookie = `sessionId=${sessionId}`;
    console.log("Button clicked!");

    socket.emit('start_session', { name, room, sessionId }, host => {
      // if (error) {
      //   console.log(error);
      //   return toast({
      //     position: "top",
      //     title: "Error",
      //     description: error,
      //     status: "error",
      //     duration: 5000,
      //     isClosable: true,
      //   });
      // }
      
      if (host) {
        history.push('/spotify_login');
      } else {
        history.push('/queue');
        return toast({
          position: "top",
          title: "Hey there",
          description: `Welcome to ${room}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  return (
    <Flex className='login' flexDirection='column' mb='8'>
      <Heading as="h1" size="4xl" textAlign='center' mb='8' fontFamily='DM Sans' fontWeight='600' letterSpacing='-2px'>Kiuit</Heading>
      <Flex className="form" gap='1rem' flexDirection={{ base: "column", md: "row" }}>
        <Input variant='filled' mr={{ base: "0", md: "4" }} mb={{ base: "4", md: "0" }} type="text" placeholder='User Name' value={name} onChange={e => setName(e.target.value)} />
        <Input variant='filled' mr={{ base: "0", md: "4" }} mb={{ base: "4", md: "0" }} type="text" placeholder='Room Name' value={room} onChange={e => setRoom(e.target.value)} />
        <IconButton colorScheme='green' isRound='true' icon={<RiArrowRightLine />} onClick={handleClick}></IconButton>
      </Flex>
    </Flex>
  )
}

export default Login