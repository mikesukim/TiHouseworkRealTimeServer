const express = require('express');
const router = express.Router();

const WebSocket = require('ws');
const redis_address = process.env.REDIS_ADDRESS || 'redis://127.0.0.1:6379';
// const redis = require('redis');

const Redis = require('ioredis');
const subscriber = new Redis(redis_address);
const publisher = new Redis(redis_address);
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
  const data = {
    room: room,
    sender: user,
    message: null,
    isBinary:null,
 };
  ws.on('message', function incoming(msg,isBinary) {
    data.message = msg;
    data.isBinary = isBinary;
    // publisher.publish('messageChannel', JSON.stringify(data));
    for (const [username, rws] of Object.entries(roomsManager.rooms[data.room])) {
      if (username !== data.sender && rws.readyState === WebSocket.OPEN){
        rws.send(data.message,{ binary: data.isBinary });
      }
    }

  });

  ws.on('close', function() {
    console.log('Close connection for user : ' + user + ' room : ' + room);
    roomsManager.leaveRoom(room,user);
  });

  ws.on('error', function(err) {
    console.log(err);
  })
});


// subscriber.on('message', function(channel,message){
//   switch(channel){
//     case 'messageChannel':
//       const data = JSON.parse(message);
//       for (const [username, rws] of Object.entries(roomsManager.rooms[data.room])) {
//         if (username !== data.sender && rws.readyState === WebSocket.OPEN){
//           rws.send(data.message,{ binary: data.isBinary });
//         }
//       }
//       break;
//     default:
//       console.log('error')
//   } 
// });
// subscriber.subscribe('messageChannel');
module.exports = router;
