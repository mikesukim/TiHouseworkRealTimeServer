const express = require('express');
const router = express.Router();

const WebSocket = require('ws');
const redis = require('redis');
const redis_address = process.env.REDIS_ADDRESS || 'redis://127.0.0.1:6379';

const subscriber = redis.createClient(redis_address);
const publisher = redis.createClient(redis_address);

router.ws('/:user/:room', function(ws, req) {
  // connected to websocket
  const user = req.params.user 
  const room = req.params.room
  console.log('Open connection for user:' + user + ' room:' + room);

  ws.on('message', function incoming(data,isBinary) {
    // broadcast message
    const aWss = req.app.get('aWss');
    aWss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.on('close', function() {
    console.log('Close connection for user : ' + user + ' room : ' + room);
  });

  ws.on('error', function(err) {
    console.log(err);
  })

  subscriber.quit();
  publisher.quit();
});

module.exports = router;
