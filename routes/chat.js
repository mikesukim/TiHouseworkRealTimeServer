const express = require('express');
const router = express.Router();

const WebSocket = require('ws');
const redis = require('redis');
const aWss = require('../app');
const redis_address = process.env.REDIS_ADDRESS || 'redis://127.0.0.1:6379';
// const subscriber = redis.createClient(redis_address);
// const publisher = redis.createClient(redis_address);

class RoomsManager {
  constructor() {
    this.rooms={};
    this.joinRoom=this.joinRoom.bind(this);
    this.leaveRoom=this.leaveRoom.bind(this);
  }
  joinRoom(roomName,userName,client){
    if(! this.rooms[roomName]) this.rooms[roomName] = {};
    this.rooms[roomName][userName]=client;
  }
  leaveRoom(roomName,userName){
    if(! this.rooms[roomName][userName]) return;
    if(Object.keys(this.rooms[roomName]).length === 1) delete this.rooms[roomName];
    else delete this.rooms[roomName][userName];
  }
}

// user should be unique
const roomsManager = new RoomsManager();
router.ws('/:user/:room', function(ws, req) {
  // connected to websocket
  const user = req.params.user 
  const room = req.params.room
  console.log('Open connection for user:' + user + ' room:' + room);
  
  roomsManager.joinRoom(room,user,ws);
  ws.on('message', function incoming(data,isBinary) {
    for (const [username, rws] of Object.entries(roomsManager.rooms[room])) {
      if (rws !== ws && rws.readyState === WebSocket.OPEN){
        rws.send(data, { binary: isBinary });
      }
    }
    // broadcast message
    // broadcast(ws,data,isBinary,req);
  });

  ws.on('close', function() {
    console.log('Close connection for user : ' + user + ' room : ' + room);
    roomsManager.leaveRoom(room,user);
  });

  ws.on('error', function(err) {
    console.log(err);
  })
});

module.exports = router;
