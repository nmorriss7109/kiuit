import React, { Component } from 'react';

class Home extends Component {
  render() {
    return(
      <div className="Home">
        <button onClick={() => window.location = 'http://localhost:5000/login'}>Create a room</button>
        <button onClick={() => window.location = 'http://localhost:3000/room'}>Join a Room</button>
      </div>
    );
  }
}

export default Home;