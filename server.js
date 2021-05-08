const request = require('request');
const querystring = require('querystring');
const cors = require('cors');

const app = require('express')();
const http = require('http').Server(app);
const io = require("socket.io")(http);

app.use(cors());

const {addUser, deleteUser, getUser, getUsers} = require('./users');
const { title } = require('process');

const redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:5000/callback';

// const makeRoomId = (length) => {
//   var text = "";
//   var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

//   for (var i = 0; i < length; i++)
//     text += possible.charAt(Math.floor(Math.random() * possible.length));

//   console.log(text);
//   return text;
// }

//Whenever someone connects this gets executed
io.on('connection', (socket) => {
  console.log('A user connected');
  const sessionID = socket.id;

  socket.on("login", ({name, room}, callback) => {
    const { user, error } = addUser(socket.id, name, room);
    if (error) return callback(error);
    socket.join(user.room);
    socket.in(room).emit('notification', {title: 'Welcome!', description: `${user.name} just joined the party.`});
    io.in(room).emit('users', getUsers(room));
    callback();
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

app.get('/login', function(req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-modify-playback-state',
      redirect_uri
    }));
});

app.get('/callback', function(req, res) {
  let code = req.query.code || null
  let authOptions = {
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
    var access_token = body.access_token;
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000/room';
    res.redirect(uri + '?access_token=' + access_token);
  });
});

let port = process.env.PORT || 5000;
console.log(`Listening on port ${port}.`);
http.listen(port);