import { IconButton } from '@chakra-ui/react'
import React from 'react'
import { BiArrowBack, BiLogIn } from 'react-icons/bi'
import { Redirect, useHistory } from 'react-router-dom'

const SpotifyLogin = () => {
  const history = useHistory();
  const redirect = () => {
    document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    history.push('/');
  }
  const spotify_login = (process.env.NODE_ENV === 'production' ? '/api/spotify_login' : 'http://localhost:5000/api/spotify_login');
  return (
    <div>
      <IconButton mr={2} isRound='true' bg='green.500' color='white' icon={<BiLogIn />} onClick={() => window.location = spotify_login} /> 
      Login with Spotify
      <br/><br/>
      <IconButton mr={2} isRound='true' bg='green.500' color='white' icon={<BiArrowBack />} onClick={redirect} /> 
      Back Home
    </div>
  );
};

export default SpotifyLogin;