import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { getCurrentUser, setCurrentUser, getAllChats, getChat, getMessagesByChat, saveMessage, initDatabase } from '../services/storageService';
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
        const user = getCurrentUser();
        if (user) {
          setCurrentUserLocal(user);
          
          // Connect to WebSocket server and send user info
          try {
            await websocketService.connect();
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
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
  }, [currentUser]);

  const setCurrentUserData = (user: User) => {
    setCurrentUserLocal(user);
    setCurrentUser(user);
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
