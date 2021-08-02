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

if (__prod__) {
  app.use(express.static("client/build"));

  // Handle React routing, return all requests to React app
  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/build/index.html', (err) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  });

  app.get('/queue', (req, res) => {
    res.sendFile(__dirname + '/client/build/index.html', (err) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  })
}

const redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:5000/callback';

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const refreshSpotifyToken = (sessionId, callback) => {
  Room.findOne({ hostId: sessionId }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      const refreshToken = data.refreshToken;
      console.log(`Refresh token: ${refreshToken}`);
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          // code: code,
          // redirect_uri,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'))
        },
        json: true
      }
    
      request.post(authOptions, async (a, b, body) => {
        const newAccessToken = body.access_token;
        const newRefreshToken = body.refresh_token;
        console.log(a);
        console.log(b);
        console.log(body);
  
        const roomName = data.roomName;
        findRoomUpdateTokens(roomName, newAccessToken, newRefreshToken, (err, __) => {
          if (err) {
            console.log(err);
          }
        });
        // const uri = process.env.FRONTEND_URI || 'http://localhost:3000/';
        
        // res.redirect(uri);
        callback();
      });
    }
  });
}

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


//Whenever someone connects this gets executed
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on("start_session", ({name, roomName, sessionId, isHost}, callback) => {
    console.log('start session');
    console.log({roomName, name, sessionId});

    if (isHost) {
      addRoom(roomName, sessionId, (err, data) => {
        if (err) {
          console.log(err);
          callback(`Room ${roomName} already exists :(`, null);
        } else {
          console.log(`Added room ${roomName}`);
          socket.join(roomName);
          socket.in(roomName).emit('notification', {title: 'Welcome!', description: `${name} just joined the party.`});
          // socket.in(roomName).emit('users', getUsers(roomName));
          addSession(name, roomName, sessionId, isHost, (err, data) => {
            if (err) console.log(err);
            console.log(data);
          })
          callback(null, data);
        }
      })
    } else {
      findRoom(roomName, (err, data) => {
        console.log(data)
        if (err) {
          console.log(err);
          callback(err);
        }
        console.log(`Data: ${data}`);
        if (data == null) {
          callback(`Room ${roomName} not found :(`, null);
        } else {
          console.log("join");
          socket.join(roomName);
          socket.in(roomName).emit('notification', {title: 'Welcome!', description: `${name} just joined the party.`});
          const tracks = data.queue;
          io.in(roomName).emit('load_tracks', tracks);
          // io.in(roomName).emit('users', getUsers(roomName));\
          addSession(name, roomName, sessionId, isHost, (err, data) => {
            if (err) console.log(err);
            console.log(data);
          })
          callback(null, data);
        }
      });
    }
  });

  socket.on("resume_session", ({ sessionId }, callback) => {
    console.log("resume session");
    findSession(sessionId, (err, data) => {
      //do something with data
      if (err) {
        console.log(err);
        callback(err);
      }
      if (data == null) {
        console.log(`Could not find session with id: ${sessionId}`);
      } else {
        console.log(`Session data: ${data}`);
        const { name, roomName } = data;
        socket.join(roomName);
        findRoom(roomName, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
            //io.in(roomName).emit("load_tracks", data.queue);
            callback(undefined, {name: name, room: data});
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
        findRoomAddTrack(roomName, track, (err, data) => {
          if (err) {
            console.log(err);
            callback(err);
          } else {
            spotifyApi.addToQueue(song.uri)
              .then(() => {
                // let queue = data.queue
                // queue.push(track);
                // callback(null, queue);
                io.in(roomName).emit('add_track', track);
                callback()
              })
              .catch((err) => {
                console.log(err);
                callback(err);
              })
          }
        })
      }
    })
  });

  socket.on("search_song", ({ searchTerm, roomName }) => {
    console.log(searchTerm)
    if (searchTerm) {
      findRoom(roomName, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const spotifyToken = data.spotifyToken;
  
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
          });
        }
        callback();
      }
    })
  });

  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

  socket.on('refresh_token', ({ sessionId }) => {
    console.log('Refreshing spotify token');
    refreshSpotifyToken(sessionId, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
});

app.get('/api/spotify_login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-modify-playback-state',
      redirect_uri,
    }));
});

app.get('/callback', async (req, res) => {
  const sessionId = req.rawHeaders.find(elem => elem.startsWith('sessionId=')).split('=')[1]

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
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000/';
    
    res.redirect(uri);
  });
});



let port = process.env.PORT || 5000;
console.log(`Listening on port ${port}.`);
http.listen(port);

// });
