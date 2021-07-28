import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { MainContext } from '../../mainContext'
import { SocketContext } from '../../socketContext'
import { Box, Flex, Heading, IconButton, Text, Menu, Button, MenuButton, MenuList, MenuItem, cookieStorageManager, HStack, Input, VStack } from "@chakra-ui/react"
import { FiFilePlus, FiList, FiLogOut, FiMenu, FiPlus, FiX } from 'react-icons/fi'
import { BiMessageDetail, BiMusic } from 'react-icons/bi'
import { RiBoxingLine, RiSendPlaneFill } from 'react-icons/ri'
import ScrollToBottom from 'react-scroll-to-bottom';
import { useToast, Image } from "@chakra-ui/react"
import './Queue.scss'
import { UsersContext } from '../../usersContext'
import getCookie from '../GetCookie';

const Queue = props => {
  const { name, room, setName, setRoom } = useContext(MainContext);
  const socket = useContext(SocketContext);
  
  const [searchBoxVisible, setSearchBoxVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { users } = useContext(UsersContext);
  const { sessionId, setSessionId } = useContext(MainContext);
  const history = useHistory();
  const toast = useToast();
  const [tracks, setTracks] = useState([]);

  

  // const tracks = [];
  // const setTracks = tracks => {
  //   tracks = tracks;
  // }

  window.onpopstate = e => logout();
  //Checks to see if there's a user present
  useEffect(() => { if (!name) return history.push('/') }, [history, name]);


  useEffect(() => {
    let isMounted = true;
  //   setTracks([
  //     {
  //       trackId: '72024ddf-fbec-4b49-bd9d-c52bde4ad207',
  //       songName: 'Blueberry Faygo',
  //       artist: 'Lil Mosey',
  //       thumbnailUrl: 'https://i.scdn.co/image/ab67616d00004851ab3f9995f4f3a83e0591c940',
  //       likes: 0,
  //       addedBy: '6ec32d0c-4463-42b3-b278-260cb6ad79a0',
  //       addedAt: 1627463657106
  //     },
  //     {
  //       trackId: '501d5efd-61da-4c75-bb94-c3be3900af28',
  //       songName: 'D.D.D',
  //       artist: 'THE BOYZ',
  //       thumbnailUrl: 'https://i.scdn.co/image/ab67616d000048514f1b960f687c83de37d4e152',
  //       likes: 0,
  //       addedBy: '6ec32d0c-4463-42b3-b278-260cb6ad79a0',
  //       addedAt: 1627463983273
  //     }
  //  ])

    socket.on("load_tracks", trackss => {
      console.log(tracks);
      if (isMounted) {
        console.log("Tracks set")
        setTracks(trackss);
      }
      console.log(trackss);
      console.log(tracks);
    });

    socket.on("add_track", track => {
      console.log(track)
      if (isMounted) setTracks(tracks => [...tracks, track]);
      console.log(tracks);
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

    socket.on("search_results", tracks => {
      const results = tracks.slice(0, 4);
      setSearchResults(results);
    });

    setSessionId(getCookie('sessionId'));

    return () => { isMounted = false };

  }, [socket, toast]);

  const triggerSearchBox = () => {
    setSearchBoxVisible(true);
  }

  const handleSearch = () => {
    console.log(searchTerm);
    socket.emit("search_song", {searchTerm: searchTerm, roomName: room}, results => setSearchResults(results));
  }

  const handleAddSong = (i) => {
    socket.emit('add_track', {song: searchResults[i], roomName: room, sessionId: sessionId}, (err, __) => {
      if (err) {
        console.log(err);
      } else {
        setSearchBoxVisible(false);
        return;
      }
    });
  };

  const logout = () => {
    setName('');
    setRoom('');
    document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    socket.emit('logout', { sessionId }, (err, __) => {
      if (err) {
        console.log(err);
      } else {
        history.push('/');
        history.go(0);
      }
    });
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

      <ScrollToBottom className='tracks' debug={false}>
        {console.log(tracks)}
        {tracks.length >= 0 ?
          tracks.map((track, i) =>
          (<HStack key={i} className={'track'} spacing='auto' bg='white' padding='5px' marginBottom='10px' borderRadius='5px' width='100%'>
              <HStack spacing='10px'>
                <Image width='50px' height='50px' src={track.thumbnailUrl}/>
                <Text fontSize='large' className='name' borderRadius='2px'>{track.trackName} by {track.artist}</Text>
              </HStack>
              <IconButton icon={<FiMenu/>} bg='white' />
            </HStack>)
          )
          :
          <Flex alignItems='center' justifyContent='center' mt='.5rem' bg='#EAEAEA' opacity='.2' w='100%' paddingBottom='10px'>
            <Box mr='2'>-----</Box>
            <BiMusic fontSize='1rem' />
            <Text ml='1' fontWeight='400'>No tracks in queue</Text>
            <Box ml='2'>-----</Box>
          </Flex>
        }
        {searchBoxVisible ?
        <VStack alignItems='center' width='100%'>
          <Box className={'search-box'} spacing='auto' bg='white' padding='5px' borderRadius='5px' width='100%'>
            <Input variant='filled' mr={{ base: "0", md: "4" }} mb={{ base: "4", md: "0" }} type="text" value={searchTerm} onChange={e => {
                setSearchTerm(e.target.value);
                console.log(searchTerm);
                handleSearch();
              }} />
            {searchResults.map((song, i) => (
              // console.log(song)
              <Box key={i} className={'song'} onClick={() => handleAddSong(i)} spacing='auto' bg='white' padding='5px' marginBottom='5px' borderRadius='5px' width='100%'>
                <HStack spacing='10px'>
                  <Image width='50px' height='50px' src={song.album.images[2].url}/>
                  <Text fontSize='large' className='name' borderRadius='2px'>{song.name} by {song.artists[0].name}</Text>
                </HStack>
              </Box>
            ))}
          </Box>
          <IconButton className='cancel-btn' icon={<FiX />} bg='red.300' color='white' isRound='true' padding='12px' onClick={() => setSearchBoxVisible(false)} />
        </VStack> 
        :
        <IconButton className='add-btn' icon={<FiPlus />} bg='#40EA9B' color='white' isRound='true' padding='12px' onClick={() => triggerSearchBox()}/>
        }
      </ScrollToBottom>
    </Flex>
  );
};

export default Queue;