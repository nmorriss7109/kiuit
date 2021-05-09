const request = require('request');
const querystring = require('querystring');
const cors = require('cors');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require("socket.io")(http);

app.use(cors());

const {addUser, deleteUser, getUser, getUsers} = require('./users');
const { title } = require('process');

const redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:5000/callback';

//Whenever someone connects this gets executed
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on("login", ({name, room}, callback) => {
    try {
      const user = addUser(socket.id, name, room);
      console.log(user);
      socket.join(user.room);
      socket.in(room).emit('notification', {title: 'Welcome!', description: `${user.name} just joined the party.`});
      io.in(room).emit('users', getUsers(room));
      callback(user.host);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("sendMessage", message => {
    const user = getUser(socket.id);
    io.in(user.room).emit('message', { user: user.name, text: message }); //TODO: Change this so users can send instructions to the communal queue
  });

  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const user = deleteUser(socket.id);
    if (user) {
      io.in(user.room).emit('notification', { title: 'Goodbye :(', description: `${user.name} just left the party.` });
      io.in(user.room).emit('users', getUsers(user.room));
    }
  });
});

app.get('/spotify_login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-modify-playback-state',
      redirect_uri
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  request.post(authOptions, function(error, response, body) {
    const access_token = body.access_token;
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000/queue';
    res.redirect(uri + '?access_token=' + access_token);
  });
});

let port = process.env.PORT || 5000;
console.log(`Listening on port ${port}.`);
http.listen(port);