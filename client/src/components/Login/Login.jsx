import React, { useContext, useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { MainContext } from '../../mainContext'
import { SocketContext } from '../../socketContext'
import { Flex, Heading, IconButton, Input, Checkbox } from "@chakra-ui/react"
import { RiArrowRightLine } from "react-icons/ri"
import { useToast } from "@chakra-ui/react"
import { UsersContext } from '../../usersContext'
import { v4 as uuidv4 } from 'uuid'
import getCookie from '../GetCookie';

// const getCookie = (name) => {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop().split(';').shift();
// }

const Login = () => {
  const socket = useContext(SocketContext)
  const { name, room, sessionId, setName, setRoom, setSessionId } = useContext(MainContext)
  const [isHost, setIsHost] = useState(false);
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
      
      // setName(name);
      // setRoom(room);

      socket.emit('resume_session', { sessionId }, (err, {name, room}) => {

        // TODO: Fix this stuff
        if (err) {
          console.log("right here");
          return toast({
            position: "top",
            title: "Error",
            description: err,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        console.log(room)
        
        setName(name);
        setRoom(room);
        history.push('/queue');
        return toast({
          position: "top",
          title: "Hey there",
          description: `Welcome to ${room.roomName}`,
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

    socket.emit('start_session', { name, roomName: room.roomName, sessionId, isHost }, (err, data) => {
      console.log(data);
      setRoom(data);
      if (err) {
        console.log(err);
      } else {
        console.log("Here")
        if (isHost) {
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
      }
    });
  };

  return (
    <Flex className='login' flexDirection='column' mb='8'>
      <Heading as="h1" size="4xl" textAlign='center' mb='8' fontFamily='DM Sans' fontWeight='600' letterSpacing='-2px'>Kiuit</Heading>
      <Flex className="form" gap='1rem' flexDirection={{ base: "column", md: "row" }}>
        <Input variant='filled' mr={{ base: "0", md: "4" }} mb={{ base: "4", md: "0" }} type="text" placeholder='User Name' value={name} onChange={e => setName(e.target.value)} />
        <Input variant='filled' mr={{ base: "0", md: "4" }} mb={{ base: "4", md: "0" }} type="text" placeholder='Room Name' value={room.roomName} onChange={e => setRoom({roomName: e.target.value})} />
        <Checkbox colorScheme='green' isChecked={isHost} onChange={(e) => setIsHost(e.target.checked)}>Hosting</Checkbox>
        <IconButton colorScheme='green' isRound='true' icon={<RiArrowRightLine />} onClick={handleClick}></IconButton>
      </Flex>
    </Flex>
  )
}

export default Login