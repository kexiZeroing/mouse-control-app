import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { mouse, Point } from '@nut-tree-fork/nut-js';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(express.static(path.join(__dirname, '../client/dist')));

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'Unknown IP';
}

const localIP = getLocalIP();
let lastPosition = { x: 0, y: 0 };

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('serverInfo', { ip: localIP, port: 3000 });

  socket.on('moveMouse', async (data) => {
    const { dx, dy } = data;
    try {
      const newX = lastPosition.x + dx;
      const newY = lastPosition.y + dy;
      await mouse.move([new Point(newX, newY)]);
      lastPosition = { x: newX, y: newY };
    } catch (e) {
      console.error('Mouse move error:', e);
    }
  });

  socket.on('mouseClick', async () => {
    try {
      await mouse.leftClick();
    } catch (e) {
      console.error('Mouse click error:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://${localIP}:${PORT}`);
});
