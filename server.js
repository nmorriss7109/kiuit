import knex from "./knex/knex.js";
import { __prod__ } from "./constants.js";
import request from "request";
import querystring from "querystring";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { addUser, deleteUser, getUser, getUsers } from "./users.js";

const main = async () => {
  const app = express();
  const http = createServer(app);
  const io = new Server(http);

  app.use(cors());

  await knex.schema.createTable('testing', (table) => {
    table.increments('id');
    table.string('name');
    table.string('room');
  })
  .then(res => console.log(res))
  .catch(err => console.error(err));

  await knex.schema.dropTable('testing')
  .then(res => console.log(res))
  .catch(err => console.error(err));

  const redirect_uri = 
    process.env.REDIRECT_URI || 
    'http://localhost:5000/callback';

  //Whenever someone connects this gets executed
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on("login", ({name, room}, callback) => {
      try {
        const user = addUser(socket.id, name, room);
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
      const refresh_token = body.refresh_token;
      console.log(`Access Token: ${access_token}`);
      console.log(`Refresh Token: ${refresh_token}`);
      const uri = process.env.FRONTEND_URI || 'http://localhost:3000/queue';
      res.redirect(uri);
    });
  });

  let port = process.env.PORT || 5000;
  console.log(`Listening on port ${port}.`);
  http.listen(port);
}

main();
