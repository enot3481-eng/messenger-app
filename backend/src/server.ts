import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const connections = new Map();
const userStatus = new Map();

wss.on('connection', (ws) => {
  let userId = '';

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'user_online') {
        userId = message.senderId;
        connections.set(userId, ws);
        userStatus.set(userId, { isOnline: true, lastSeen: new Date() });
        console.log(`Пользователь ${userId} онлайн`);
      }

      if (message.receiverId && connections.has(message.receiverId)) {
        const receiverWs = connections.get(message.receiverId);
        if (receiverWs.readyState === 1) {
          receiverWs.send(data);
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  });

  ws.on('close', () => {
    if (userId) {
      connections.delete(userId);
      userStatus.set(userId, { isOnline: false, lastSeen: new Date() });
      console.log(`Пользователь ${userId} оффлайн`);
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
