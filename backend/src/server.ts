import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { IncomingMessage } from 'http';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store user connections and user data
const connections = new Map();
const userStatus = new Map();
const users = new Map(); // Store user info by userId

wss.on('connection', (ws: WebSocket) => {
  let userId = '';

  ws.on('message', (data) => {
    try {
      // Convert data to string
      const dataString = data.toString();
      const message = JSON.parse(dataString);

      if (message.type === 'user_online') {
        userId = message.senderId;
        connections.set(userId, ws);
        userStatus.set(userId, { isOnline: true, lastSeen: new Date() });
        
        // Store user info if provided
        if (message.userInfo) {
          users.set(userId, message.userInfo);
        }
        
        console.log(`Пользователь ${userId} онлайн`);
      }

      // Handle user search request
      if (message.type === 'search_users') {
        const query = message.query;
        const matchingUsers = Array.from(users.entries())
          .filter(([id, userInfo]) => 
            userInfo.tag && userInfo.tag.toLowerCase().includes(query.toLowerCase())
          )
          .map(([id, userInfo]) => ({
            id,
            ...userInfo
          }));

        // Send search results back to the requesting user
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'search_results',
            users: matchingUsers
          }));
        }
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

// API endpoint to get user by tag
app.get('/api/users/tag/:tag', (req, res) => {
  const tag = req.params.tag.toLowerCase();
  const matchingUsers = Array.from(users.entries())
    .filter(([id, userInfo]) => 
      userInfo.tag && userInfo.tag.toLowerCase() === tag
    )
    .map(([id, userInfo]) => ({
      id,
      ...userInfo
    }));

  res.json(matchingUsers);
});

// API endpoint to search users by tag
app.get('/api/users/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  const matchingUsers = Array.from(users.entries())
    .filter(([id, userInfo]) => 
      userInfo.tag && userInfo.tag.toLowerCase().includes(query)
    )
    .map(([id, userInfo]) => ({
      id,
      ...userInfo
    }));

  res.json(matchingUsers);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = parseInt(process.env.PORT || '8080');
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
