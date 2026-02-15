import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { getCurrentUser, setCurrentUser, getAllChats, getChat, getMessagesByChat, saveMessage, initDatabase, saveUser } from '../services/storageService';
import { generateId } from '../services/encryptionService';
import { websocketService } from '../services/websocketService';

interface AppContextType {
  currentUser: User | null;
  setCurrentUserData: (user: User) => void;
  chats: Chat[];
  loadChats: () => Promise<void>;
  selectedChat: Chat | null;
  selectChat: (chatId: string) => Promise<void>;
  messages: Message[];
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, file?: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserLocal] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initDatabase();
        let user = getCurrentUser();
        
        // If no user in storage, try to get from localStorage as fallback
        if (!user) {
          const storedUserStr = localStorage.getItem('currentUser');
          if (storedUserStr) {
            try {
              const parsedUser = JSON.parse(storedUserStr);
              if (parsedUser && typeof parsedUser === 'object') {
                user = parsedUser;
                // Restore user to proper storage
                if (user) {
                  setCurrentUser(user);
                }
              }
            } catch (parseErr) {
              console.error('Error parsing stored user:', parseErr);
            }
          }
        }
        
        if (user) {
          setCurrentUserLocal(user);

          // Connect to WebSocket server and send user info
          try {
            await websocketService.connect();
            console.log('Отправляем информацию о пользователе на сервер:', {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              tag: user.tag,
              avatar: user.avatar,
              bio: user.bio,
              createdAt: user.createdAt,
              publicKey: user.publicKey
            });
            
            websocketService.userOnline(user.id, {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              tag: user.tag,
              avatar: user.avatar,
              bio: user.bio,
              createdAt: user.createdAt,
              publicKey: user.publicKey
            });
            
            // Listen for incoming messages
            websocketService.on('message', async (data: any) => {
              try {
                const messageData = JSON.parse(typeof data === 'string' ? data : JSON.stringify(data));
                
                // Check if this is a chat message
                if (messageData.type === 'message' && messageData.content) {
                  const newMessage: Message = {
                    id: generateId(),
                    chatId: messageData.chatId || 'default',
                    senderId: messageData.senderId,
                    senderName: messageData.senderName,
                    content: messageData.content,
                    type: messageData.type || 'text',
                    timestamp: new Date(messageData.timestamp || Date.now()),
                    isRead: false,
                    isEncrypted: messageData.isEncrypted || false
                  };
                  
                  // Save the received message
                  await saveMessage(newMessage);
                  
                  // If this message is for the currently selected chat, reload messages
                  if (selectedChat?.id === newMessage.chatId) {
                    await loadMessages(newMessage.chatId);
                  }
                  
                  // Reload chats to update last message
                  await loadChats();
                }
              } catch (error) {
                console.error('Error processing incoming message:', error);
              }
            });
          } catch (wsErr) {
            console.error('WebSocket connection error:', wsErr);
          }
        }
      } catch (err) {
        setError('Ошибка при инициализации приложения');
        console.error(err);
      }
    };

    initApp();
    
    // Clean up WebSocket connection on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [currentUser]);

  const setCurrentUserData = (user: User) => {
    setCurrentUserLocal(user);
    setCurrentUser(user);
    
    // Also save to storage to ensure persistence
    saveUser(user).catch(err => console.error('Error saving user:', err));
  };

  const loadChats = async () => {
    try {
      setIsLoading(true);
      if (!currentUser) return;
      
      const allChats = await getAllChats();
      const userChats = allChats.filter(chat => chat.participantIds.includes(currentUser.id));
      setChats(userChats);
    } catch (err) {
      setError('Ошибка при загрузке чатов');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = await getChat(chatId);
      if (chat) {
        setSelectedChat(chat);
        await loadMessages(chatId);
      }
    } catch (err) {
      setError('Ошибка при загрузке чата');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const msgs = await getMessagesByChat(chatId);
      setMessages(msgs);
    } catch (err) {
      setError('Ошибка при загрузке сообщений');
      console.error(err);
    }
  };

  const sendMessage = async (chatId: string, content: string, file?: File) => {
    if (!currentUser) return;

    try {
      const message: Message = {
        id: generateId(),
        chatId,
        senderId: currentUser.id,
        senderName: currentUser.nickname,
        content: content || '',
        type: file ? 'file' : 'text',
        timestamp: new Date(),
        isRead: false,
        isEncrypted: false,
        fileData: file
          ? {
              name: file.name,
              size: file.size,
              mimeType: file.type,
              url: URL.createObjectURL(file),
              uploadedAt: new Date()
            }
          : undefined
      };

      await saveMessage(message);
      await loadMessages(chatId);
      await loadChats();
      
      // Send message via WebSocket to other participants
      try {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          // Send to all participants except current user
          for (const participantId of chat.participantIds) {
            if (participantId !== currentUser.id) {
              websocketService.sendMessage({
                type: 'message',
                chatId,
                senderId: currentUser.id,
                senderName: currentUser.nickname,
                receiverId: participantId,
                content: message.content,
                timestamp: Date.now()
              });
            }
          }
        }
      } catch (wsErr) {
        console.error('Error sending message via WebSocket:', wsErr);
      }
    } catch (err) {
      setError('Ошибка при отправке сообщения');
      console.error(err);
    }
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUserData,
    chats,
    loadChats,
    selectedChat,
    selectChat,
    messages,
    loadMessages,
    sendMessage,
    isLoading,
    error
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
