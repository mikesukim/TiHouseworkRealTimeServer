var express = require('express');
var router = express.Router();

router.ws('/', function(ws, req) {
  ws.on('message', function incoming(data,isBinary) {
    const aWss = req.app.get('aWss');
    const WebSocket = req.app.get('WebSocket');
    aWss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
    });
  });
});



module.exports = router;
