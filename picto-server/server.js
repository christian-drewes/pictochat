const WebSocket = require('ws');

// Bind to 0.0.0.0 to allow external network connections
const wss = new WebSocket.Server({ port: 9999, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  console.log('New client connected.');

  ws.on('message', (data) => {
    // The data arrives as a Buffer; convert it back to a string for JSON parsing
    const messageString = data.toString();
    
    // Broadcast the incoming message to all OTHER connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});

console.log('WebSocket server running on port 9999');