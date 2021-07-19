const express = require('express');
const router = express.Router();

const WebSocket = require('ws');
const redis = require('redis');
const { json } = require('express');
const redis_address = process.env.REDIS_ADDRESS || 'redis://127.0.0.1:6379';
const subscriber = redis.createClient(redis_address);
const publisher = redis.createClient(redis_address);

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

const ACTION_TYPE = {
  MESSAGE: 'message',
  ADD_USER: 'add_user',
  REMOVE_USER: 'remove_user'
}

// user should be unique
const roomsManager = new RoomsManager();
router.ws('/:user/:room', function(ws, req) {
  // connected to websocket
  const user = req.params.user 
  const room = req.params.room
  console.log('Open connection for user:' + user + ' room:' + room);

  // join room
  roomsManager.joinRoom(room,user,ws);

  // prepare data to send
  const jsonData = {
    room: room,
    sender: user,
    action: null,
    data: null,
    isBinary:null,
 };
  ws.on('message', function incoming(msg,isBinary) {
    
    // check incoming msg format
    try {
      const incomingData = JSON.parse(msg);

       // fill rest of data to send
      jsonData.data = incomingData.data;
      jsonData.action = ACTION_TYPE.MESSAGE;
      jsonData.isBinary = isBinary;
    } catch(e) {
      ws.send("incorrect data format", err => {
        ws.close()
        if (err) { return console.error(err); }
      })
    }
  
    // publish to redis
    publisher.publish('messageChannel', JSON.stringify(jsonData));
  });

  ws.on('close', function() {
    console.log('Close connection for user : ' + user + ' room : ' + room);
    roomsManager.leaveRoom(room,user);
  });

  ws.on('error', function(err) {
    console.log(err);
  })
});

subscriber.on('message', function(channel,message){
  switch(channel){
    case 'messageChannel':
      const jsonData = JSON.parse(message);
      // broadcasting to all room users
      for (const [username, rws] of Object.entries(roomsManager.rooms[jsonData.room])) {
        if (username !== jsonData.sender && rws.readyState === WebSocket.OPEN){
          rws.send(JSON.stringify({
            action: jsonData.action,
            data : jsonData.data,
            sender: jsonData.sender,
          }),{ binary: jsonData.isBinary });
        }
      }
      break;
    default:
      console.log('error')
  } 
});
subscriber.on('error', function(error){
  console.log(error);
})
subscriber.subscribe('messageChannel');
module.exports = router;
