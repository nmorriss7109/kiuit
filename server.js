import knex from "./db/knex.js";
import { __prod__ } from "./constants.js";
import request from "request";
import querystring from "querystring";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { addUser, deleteUser, getUser, getUsers } from "./users.js";
import { error, time } from "console";

const main = async () => {
  const app = express();
  const http = createServer(app);
  const io = new Server(http);

  app.use(cors());

  //Whenever someone connects this gets executed
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on("start_session", ({name, room, sessionId}, callback) => {
      console.log('start session');
      knex('rooms')
        .where({ room_name: room })
        .then(rows => { 
          console.log(rows.length);
          let host = true;
          if (rows.length != 0) host = false;
          console.log(`host value ${host}`);
          let permissions = host ? 'host' : 'guest';
  
          const session = {
            session_id: sessionId,
            name: name,
            room_name: room,
            permissions: permissions,
            created_at: Date.now(),
            updated_at: Date.now()
          }
          knex('sessions')
            .insert(session)
            .catch(ex => {
              throw(ex);
            });
            
          // const user = addUser(socket.id, name, room);
          socket.join(room);
          
          if (host) {
            knex('rooms')
              .insert({
                room_name: room,
                host_id: sessionId,
                spotify_token: null,
                refresh_token: null,
                created_at: Date.now(),
                updated_at: Date.now()
              })
              .then(res => console.log(res));
          }
          
          socket.in(room).emit('notification', {title: 'Welcome!', description: `${name} just joined the party.`});
          io.in(room).emit('users', getUsers(room));
          callback(host);
        })
        .catch(ex => {});
    });

    socket.on("resume_session", ({ sessionId }, callback) => {
      console.log("resume session");
      knex('sessions')
        .where({ session_id: sessionId })
        .then(rows => {
          console.log(`rows: ${rows}`);
          if (rows[0] != null) {
            console.log("were here");
            socket.join(rows[0].room_name);
            callback(rows[0]);
          } else {
            console.log("nah were here");
            callback(new Error("Could not find the stored session."));
          }
        })
        .catch(ex => {
          console.log(ex);
          callback(ex);
        });
    });

    socket.on("add_song", song => {
      console.log(song);
      io.in(song.room).emit('add_song', song);
    });

    socket.on("logout", sessionId => {
      let host = false;
      let room = undefined;
      knex('sessions')
        .where({ session_id: sessionId })
        .then(rows => {
          if (rows[0].permissions == 'host') {
            host = true;
            room = rows[0].room_name;
          }
          console.log(`Host: ${host}; Room: ${room}`);
          if (host) {
            knex('rooms')
              .where({ room_name: room })
              .del()
              .catch(ex => {});
          }
          knex('sessions')
            .where({ session_id: sessionId })
            .del()
            .catch(ex => {});
        })
        .catch(ex => {});
    });

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', _ => {
      console.log('A user disconnected');
    });
  });

  app.get('/spotify_login', (req, res) => {
    const room_name = req.query.room_name;
    console.log(`Spotify_login: ${room_name}`);

    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        room_name:room_name,
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: 'user-modify-playback-state',
        redirect_uri,
      }));
  });

  const redirect_uri = 
    process.env.REDIRECT_URI || 
    'http://localhost:5000/callback';

  app.get('/callback', async (req, res) => {
    const sessionId = req.rawHeaders.find(elem => elem.startsWith('sessionId=')).split('=')[1]
    // const rooms = await knex('rooms').where({ host_id: sessionId });
    // const room_name = rooms[0].room_name;
  
    console.log(sessionId);
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
    request.post(authOptions, async (_, __, body) => {
      const spotify_token = body.access_token;
      const refresh_token = body.refresh_token;
      await knex('rooms')
              .where({ host_id:sessionId })
              .update({ 
                spotify_token: spotify_token,
                refresh_token: refresh_token,
                updated_at: Date.now()
              });
      const uri = process.env.FRONTEND_URI || 'http://localhost:3000/queue';
      
      res.redirect(uri);
    });
  });

  let port = process.env.PORT || 5000;
  console.log(`Listening on port ${port}.`);
  http.listen(port);
}

main();
