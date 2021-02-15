import React, { Component } from 'react';
import queryString from 'query-string';
import axios from 'axios';
// import { response } from 'express';

class Room extends Component {
  state = {
    isHost: false,
  }

  componentDidMount() {
    let path_prefix = '/v1/me/player/queue?uri=spotify%3Atrack%3A'
    let song_id = 'spotify:track:6jYx1PzbDvbrYkj4x4MwYc'

    let parsed = queryString.parse(window.location.search);
    let access_token = parsed.access_token;
    console.log(access_token);

    if (access_token !== undefined) {
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${access_token}`;
    }

    axios.post('https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A6jYx1PzbDvbrYkj4x4MwYc');
  }
  // ':path': path_prefix + song_id,
  render() {
    return (
      <div className="Room">
        <button onClick={() => window.location = 'http://localhost:3000/'}>Leave Room</button>
      </div>
    );
  }
}

export default Room;