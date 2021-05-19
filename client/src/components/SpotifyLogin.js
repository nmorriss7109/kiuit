import { IconButton } from '@chakra-ui/react'
import React from 'react'
import { BiArrowBack } from 'react-icons/bi'
import { Redirect, useHistory } from 'react-router-dom'

export default function SpotifyLogin() {
  const history = useHistory();
  const redirect = () => {
    document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    history.push('/');
  }
  return (
    <div>
      <IconButton mr={2} isRound='true' bg='green.300' color='white' icon={<BiArrowBack />} onClick={() => window.location = 'http://localhost:5000/spotify_login'} /> Login with Spotify;
      <IconButton mr={2} isRound='true' bg='green.300' color='white' icon={<BiArrowBack />} onClick={redirect} /> Back Home;
    </div>
  );
};