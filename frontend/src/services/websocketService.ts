import io, { Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  senderId: string;
  receiverId?: string;
  content?: any;
  timestamp: number;
}

class WebSocketServiceImpl {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Function>>();

  connect(serverUrl: string = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:8080'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket']
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, (data) => callback(data));
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  sendMessage(message: WebSocketMessage): void {
    this.emit('message', message);
  }

  userOnline(userId: string, userInfo?: any): void {
    this.emit('user_online', { 
      userId, 
      userInfo, // Send user info to server
      timestamp: Date.now() 
    });
  }

  searchUsers(query: string, callback: (users: any[]) => void): void {
    // Listen for search results
    this.on('search_results', (data: any) => {
      if (data.users) {
        callback(data.users);
      }
    });

    // Send search request
    this.emit('search_users', { query });
  }

  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const websocketService = new WebSocketServiceImpl();
