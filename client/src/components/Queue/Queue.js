import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { MainContext } from '../../mainContext'
import { SocketContext } from '../../socketContext'
import { Box, Flex, Heading, IconButton, Text, Menu, Button, MenuButton, MenuList, MenuItem, cookieStorageManager, HStack } from "@chakra-ui/react"
import { FiFilePlus, FiList, FiLogOut, FiMenu, FiPlus } from 'react-icons/fi'
import { BiMessageDetail, BiMusic } from 'react-icons/bi'
import { RiSendPlaneFill } from 'react-icons/ri'
import ScrollToBottom from 'react-scroll-to-bottom';
import { useToast, Image } from "@chakra-ui/react"
import './Queue.scss'
import { UsersContext } from '../../usersContext'

const Queue = () => {
  const { name, room, setName, setRoom } = useContext(MainContext);
  const socket = useContext(SocketContext);
  // const [message, setMessage] = useState('');
  const [song, setSong] = useState({
    room: room,
    name: 'Penny Lane',
    artist: 'The Beatles',
    thumbnail: 'https://is2-ssl.mzstatic.com/image/thumb/Music124/v4/74/de/04/74de0482-bbdd-d83d-7f92-3f41b0a0758b/source/600x600bb.jpg',
    queuePosition: 0
  });
  // const [messages, setMessages] = useState([]);
  const [songs, setSongs] = useState([]);
  const { users } = useContext(UsersContext);
  const { sessionId, setSessionId } = useContext(MainContext);
  const history = useHistory();
  const toast = useToast();

  window.onpopstate = e => logout();
  //Checks to see if there's a user present
  useEffect(() => { if (!name) return history.push('/') }, [history, name]);


  useEffect(() => {
    socket.on("add_song", song => {
      console.log("here")
      setSongs(songs => [...songs, song]);
    });

    socket.on("notification", notif => {
      toast({
        position: "top",
        title: notif?.title,
        description: notif?.description,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    });

  }, [socket, toast]);


  const handleAddSong = () => {
    socket.emit('add_song', song, () => setSong({}));
    // setSong({});
  };

  const logout = () => {
    setName('');
    setRoom('');
    document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    socket.emit('logout', sessionId);
    history.push('/');
    history.go(0);
  };

  return (
    <Flex className='room' flexDirection='column' width={{ base: "100%", sm: '400px' }} height={{ base: "100%", sm: "auto" }} >
      <Heading className='heading' as='h4' bg='white' p='1rem 1.5rem' borderRadius='10px 10px 0 0'>
        <Flex alignItems='center' justifyContent='space-between'>
          <Menu >
            <MenuButton as={IconButton} icon={<FiList />} isRound='true' bg='blue.300' color='white' />
            <MenuList>
              {
                users && users.map(user => {
                  return (
                    <MenuItem minH='40px' key={user.id}>
                      <Text fontSize='sm'>{user.name}</Text>
                    </MenuItem>
                  );
                })
              }
            </MenuList>
          </Menu>
          <Flex alignItems='center' flexDirection='column' flex={{ base: "1", sm: "auto" }}>
            <Heading fontSize='lg'> {room.slice(0, 1).toUpperCase() + room.slice(1)}</Heading>
            <Flex alignItems='center'><Text mr='1' fontWeight='400' fontSize='md' opacity='.7' letterSpacing='0' >{name}</Text><Box h={2} w={2} borderRadius='100px' bg='green.300'></Box></Flex>
          </Flex>
          <IconButton icon={<FiLogOut />} bg='red.300' color='white' isRound='true' onClick={logout} />
        </Flex>
      </Heading>

      <ScrollToBottom className='songs' debug={false}>
        {/* {messages.length > 0 ? */}
        {songs.length > 0 ?
          songs.map((song, i) =>
          (<HStack key={i} className={'song'} spacing='auto' bg='white' padding='5px' marginBottom='10px' borderRadius='5px' width='100%'>
              <HStack spacing='10px'>
                <Image width='50px' height='50px' src={song.thumbnail}/>
                <Text fontSize='large' className='name' borderRadius='2px'>{song.name} by {song.artist}</Text>
              </HStack>
              <IconButton icon={<FiMenu/>} bg='white' />
            </HStack>)
          )
          :
          <Flex alignItems='center' justifyContent='center' mt='.5rem' bg='#EAEAEA' opacity='.2' w='100%' paddingBottom='10px'>
            <Box mr='2'>-----</Box>
            <BiMusic fontSize='1rem' />
            <Text ml='1' fontWeight='400'>No songs in queue</Text>
            <Box ml='2'>-----</Box>
          </Flex>
        }
        <IconButton className='add-btn' icon={<FiPlus />} bg='#40EA9B' color='white' isRound='true' padding='12px' onClick={handleAddSong}/>
      </ScrollToBottom>
    </Flex>
  );
};

export default Queue