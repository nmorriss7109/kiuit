import mongoose from "mongoose";

var Schema = mongoose.Schema;

// Create Session schema
var sessionSchema = new Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean
  }
}, { timestamps: true });

var Session = mongoose.model("Session", sessionSchema);


// Create Room schema
var roomSchema = new Schema({
  roomName: {
    type: String,
    unique: true,
    required: true
  },
  hostId: {
    type: String,
    required: true
  },
  spotifyToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  queue: [{
    trackId: { type: String },
    songName: { type: String },
    artist: { type: String },
    thumbnailUrl: { type: String },
    likes: { type: Number },
    addedBy: { type: String },
    addedAt: { type: Number }
  }]
}, { timestamps: true });

var Room = mongoose.model("Room", roomSchema);


const addSession = (name, roomName, sessionId, isHost, done) => {
  const session = new Session({ sessionId: sessionId, name: name, roomName: roomName, isHost: isHost });
  session.save((err, __) => {
    if (err) return done(err);
    return done(null, session);
  });
};

const findSession = (sessionId, done) => {
  Session.findOne({ sessionId: sessionId }, (err, data) => {
    if(err) return done(err);
    return done(null, data);
  })
};

const deleteSession = (sessionId, done) => {
  Session.findOneAndDelete({ sessionId: sessionId }, (err, data) => {
    if (err) return done(err);
    return done(null, data);
  })
}

const addRoom = (roomName, hostId, done) => {
  const room = new Room({ roomName: roomName, hostId: hostId });
  room.save((err, __) => {
    if (err) return done(err);
    return done(null, room);
  })
};

const findRoom = (roomName, done) => {
  Room.findOne({ roomName: roomName }, (err, data) => {
    if(err) return done(err);
    return done(null, data);
  })
};

const deleteRoom = (roomName, done) => {
  Room.findOneAndRemove({ roomName: roomName }, (err, __) => {
    if (err) return done(err);
  })
}

const findRoomUpdateTokens = (roomName, spotifyToken, refreshToken, done) => {
  Room.findOneAndUpdate(
    { roomName: roomName },
    { spotifyToken: spotifyToken,
      refreshToken: refreshToken },
    (err, data) => {
      if (err) done(err);
      return done(null, data)
    })
};

const findRoomAddTrack = (roomName, { trackId, songUri, songName, artist, thumbnailUrl, likes, addedBy }, done) => {
  const track = {
      trackId: trackId, 
      songUri: songUri,
      songName: songName, 
      artist: artist, 
      thumbnailUrl: thumbnailUrl, 
      likes: likes, 
      addedBy: addedBy,
      addedAt: Date.now()
    };
  Room.findOneAndUpdate(
    { roomName: roomName },
    { $push: {queue: track} },
    (err, data) => {
      if (err) return done(err);
      console.log(`Data ${data}`)
      return done(null, data);
    })
};


export default {
  Session,
  addSession, findSession, deleteSession,
  Room,
  addRoom, findRoom, deleteRoom, findRoomUpdateTokens, findRoomAddTrack
}