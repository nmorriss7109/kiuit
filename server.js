import { __prod__ } from "./constants.js";
import request from "request";
import querystring from "querystring";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import SpotifyWebApi from "spotify-web-api-node";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from "mongoose";
import kiuit from "./db.js"
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const http = createServer(app);
const io = new Server(http);

const Session = kiuit.Session;
const Room = kiuit.Room;
const addSession = kiuit.addSession;
const findSession = kiuit.findSession;
const deleteSession = kiuit.deleteSession;
const addRoom = kiuit.addRoom;
const findRoom = kiuit.findRoom;
const deleteRoom = kiuit.deleteRoom;
const findRoomUpdateTokens = kiuit.findRoomUpdateTokens;
const findRoomAddTrack = kiuit.findRoomAddTrack;

app.use(cors())

if (process.env.NODE_ENV ===  "production") {
  server.use(express.static("client/build"));
}


var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


//Whenever someone connects this gets executed
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on("start_session", ({name, roomName, sessionId, isHost}, callback) => {
    console.log('start session');
    console.log({roomName, name, sessionId});

    addSession(name, roomName, sessionId, (err, __) => {
      if (err) console.log(err);
    })

    if (isHost) {
      addRoom(roomName, sessionId, (err, __) => {
        if (err) {
          console.log(err);
          callback(err);
        } else {
          console.log(`Added room ${roomName}`);
          socket.join(roomName);
          socket.in(roomName).emit('notification', {title: 'Welcome!', description: `${name} just joined the party.`});
          // socket.in(roomName).emit('users', getUsers(roomName));
          callback();
        }
      })
    } else {
      findRoom(roomName, (err, data) => {
        console.log(data)
        if (err) {
          console.log(err);
          callback(err);
        }
        if (!data) {
          callback("Error");
        } else {
          console.log("join");
          socket.join(roomName);
          socket.in(roomName).emit('notification', {title: 'Welcome!', description: `${name} just joined the party.`});
          io.in(roomName).emit('load_tracks', data.queue);
          callback();
          // io.in(roomName).emit('users', getUsers(roomName));
        }
      });
    }
  });

  socket.on("resume_session", ({ sessionId }, callback) => {
    console.log("resume session");
    findSession(sessionId, (err, data) => {
      //do something with data
      if (err || !data) {
        console.log(err);
        callback(err);
      } else {
        console.log(data);
        const { name, roomName } = data;
        socket.join(roomName);
        findRoom(roomName, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            console.log(data.queue);
            io.in(roomName).emit("load_tracks", data.queue);
            callback(undefined, { name, roomName });
          }
        })        
      }
    });
  });

  socket.on("add_track", ({ song, roomName, sessionId }, callback) => {
    findRoom(roomName, (err, data) => {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        const spotifyToken = data.spotifyToken;
        spotifyApi.setAccessToken(spotifyToken);
        const track = {
          trackId: randomUUID(),
          songUri: song.uri,
          songName: song.name,
          artist: song.artists[0].name,
          thumbnailUrl: song.album.images[2].url,
          likes: 0,
          addedBy: sessionId,
        }
        console.log(track);
        io.in(roomName).emit('add_track', track);
        findRoomAddTrack(roomName, track, (err, __) => {
          if (err) {
            console.log(err);
            callback(err);
          } else {
            spotifyApi.addToQueue(song.uri)
              .then(() => {
                callback();
              })
              .catch((err) => {
                console.log(err);
              })
          }
        })
      }
    })
  //   console.log(data.song);
  //   const room_name = data.room_name;
  //   const tokens = await knex('rooms')
  //     .select('spotify_token', 'refresh_token')
  //     .where({ room_name: room_name });

  //   spotifyApi.setAccessToken(tokens[0].spotify_token);
  //   console.log(data.room_name);
  //   const track = {
  //     name: data.song.name,
  //     artist: data.song.artists[0].name,
  //     thumbnail_url: data.song.album.images[2].url,
  //     room_name: data.room_name,
  //     added_by: data.session_id,
  //     likes: 0,
  //     created_at: Date.now(),
  //     updated_at: Date.now(),
  //   }

  //   console.log("Right over here folks")
    // io.in(data.room_name).emit('add_song', track);

  //   await knex('tracks')
  //     .insert(track)
  //     .catch(ex => {
  //       throw(ex);
  //     });
    
  //   await spotifyApi.addToQueue(data.song.uri)
  //     .catch(ex => {
  //       console.log(ex);
  //     });
  });

  socket.on("search_song", ({ searchTerm, roomName }) => {
    console.log(searchTerm)
    if (searchTerm) {
      findRoom(roomName, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const spotifyToken = data.spotifyToken;
          // const refreshToken = data.refreshToken;
  
          spotifyApi.setAccessToken(spotifyToken);
          console.log(searchTerm);
          spotifyApi.searchTracks(searchTerm)
            .then((res) => {
              socket.emit("search_results", res.body.tracks.items);
            })
            .catch((err) => {
              console.log(err);
            })
        }
      })
    }
  });

  socket.on("logout", ({ sessionId }, callback) => {
    deleteSession(sessionId, (err, data) => {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        const { roomName, isHost } = data;
        if (isHost) {
          deleteRoom(roomName, (err, __) => {
            if (err) {
              console.log(err);
              callback(err);
            } else {
              callback();
            }
          })
        }
      }
    })
  });

  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', _ => {
    console.log('A user disconnected');
  });
});

app.post('/spotify_login', (req, res) => {
  console.log(req);
  console.log('PRINT THIS OUT FOR GODS SAKE');

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
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
    const spotifyToken = body.access_token;
    const refreshToken = body.refresh_token;

    Room.findOne({ hostId: sessionId }, (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log(data);
      const roomName = data.roomName;
      findRoomUpdateTokens(roomName, spotifyToken, refreshToken, (err, __) => {
        if (err) {
          console.log(err);
        }
      })
    })
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000/queue';
    
    res.redirect(uri);
  });
});

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));

//   // Handle React routing, return all requests to React app
//   app.get('*', (req, res) => {
//     res.sendFile(__dirname + '/client/build/index.html');
//     // res.sendFile('./client/build/index.html');
//   });
// }

let port = process.env.PORT || 5000;
console.log(`Listening on port ${port}.`);
http.listen(port);

// });
