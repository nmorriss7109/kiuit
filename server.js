import knex from "./knex/knex.js";
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

  await knex.schema.createTable('sessions', (table) => {
    table.uuid('session_id').primary();
    table.string('name').notNullable();
    table.string('room_name').notNullable();
    table.enu('permissions', ['host', 'admin', 'guest']).notNullable();
    // table.string('spotify_token').nullable();
    // table.string('refresh_token').nullable();
    table.bigInteger('created_at').notNullable();
    table.bigInteger('updated_at').notNullable();
  })
  .then((res) => {
    console.log(res);
    console.log('sessions table is created!');
  })
  .catch(err => console.error(err));

  await knex.schema.createTable('rooms', (table) => {
    table.string('room_name').primary();
    table.uuid('host_id').notNullable();
    table.string('spotify_token').nullable();
    table.string('refresh_token').nullable();
    table.bigInteger('created_at').notNullable();
    table.bigInteger('updated_at').notNullable();
  })
  .then((res) => {
    console.log(res);
    console.log('rooms table is created!');
  })
  .catch(err => console.error(err));

  // await knex.schema.dropTable('sessions')
  // .then(res => console.log(res))
  // .catch(err => console.error(err));

  const redirect_uri = 
    process.env.REDIRECT_URI || 
    'http://localhost:5000/callback';

  //Whenever someone connects this gets executed
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on("start_session", ({name, room, sessionId}, callback) => {
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
            // spotify_token: null,
            // refresh_token: null,
            created_at: Date.now(),
            updated_at: Date.now()
          }
          knex('sessions')
            .insert(session)
            .catch(ex => {
              // console.log(ex);
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
      knex('sessions')
        .where({ session_id: sessionId })
        .then(rows => {
          console.log(`rows: ${rows}`);
          if (rows[0] != null) {
            console.log("were here");
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
    socket.on('disconnect', sessionId => {
      console.log('A user disconnected');
      const user = deleteUser(socket.id);
      if (user) {
        io.in(room).emit('notification', { title: 'Goodbye :(', description: `${name} just left the party.` });
        io.in(room).emit('users', getUsers(room));
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
