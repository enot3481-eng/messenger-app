import { User, Chat, Message, AuthToken, FileRecord } from '../types';

const DB_NAME = 'MessengerDB';
const DB_VERSION = 1;

let db: IDBDatabase;

export const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('users')) {
        const userStore = database.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('tag', 'tag', { unique: true });
      }

      if (!database.objectStoreNames.contains('chats')) {
        const chatStore = database.createObjectStore('chats', { keyPath: 'id' });
        chatStore.createIndex('participantIds', 'participantIds', { multiEntry: true });
      }

      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('chatId', 'chatId');
        msgStore.createIndex('timestamp', 'timestamp');
      }

      if (!database.objectStoreNames.contains('files')) {
        const fileStore = database.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('chatId', 'chatId');
        fileStore.createIndex('uploadedAt', 'uploadedAt');
      }

      if (!database.objectStoreNames.contains('authTokens')) {
        database.createObjectStore('authTokens', { keyPath: 'email' });
      }
    };
  });
};

export const saveUser = async (user: User): Promise<void> => {
  // Save to localStorage for cross-port persistence
  saveUserLocal(user);
  
  // Also save to IndexedDB for local app performance
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  store.put(user);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getUser = async (id: string): Promise<User | undefined> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getUserByTag = async (tag: string): Promise<User | undefined> => {
  const normalizedTag = tag.toLowerCase();

  // Try localStorage first (works across ports)
  const user = getUserByTagLocal(normalizedTag);
  if (user) return user;

  // Fallback to IndexedDB
  if (!db) throw new Error('База данных не инициализирована');

  const tx = db.transaction('users', 'readonly');
  const index = tx.objectStore('users').index('tag');

  return new Promise((resolve, reject) => {
    const request = index.get(normalizedTag);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// New function to search users by partial tag match - now includes server search
export const searchUsersByTag = async (tagQuery: string): Promise<User[]> => {
  const normalizedQuery = tagQuery.toLowerCase();
  
  // Search in localStorage first
  const localMatches = searchUsersByTagLocal(normalizedQuery);

  // Search in IndexedDB
  let indexedDBMatches: User[] = [];
  if (db) {
    try {
      const tx = db.transaction('users', 'readonly');
      const store = tx.objectStore('users');

      indexedDBMatches = await new Promise((resolve, reject) => {
        const allUsers: User[] = [];
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const user = cursor.value as User;
            if (user.tag.toLowerCase().includes(normalizedQuery)) {
              allUsers.push(user);
            }
            cursor.continue();
          } else {
            resolve(allUsers);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error searching in IndexedDB:', error);
    }
  }

  // Combine local and indexedDB results
  let localAndIndexedMatches = [...localMatches];
  for (const indexedUser of indexedDBMatches) {
    if (!localAndIndexedMatches.some(u => u.id === indexedUser.id)) {
      localAndIndexedMatches.push(indexedUser);
    }
  }

  // Search on server if available
  try {
    const response = await fetch(`${import.meta.env.VITE_WS_SERVER_URL}/api/users/search/${normalizedQuery}`);
    if (response.ok) {
      const serverUsers = await response.json();
      // Combine all results, removing duplicates
      const allMatches = [...localAndIndexedMatches];
      for (const serverUser of serverUsers) {
        if (!allMatches.some(u => u.id === serverUser.id)) {
          // Convert server user to local User type
          const user: User = {
            id: serverUser.id,
            email: serverUser.email || '',
            nickname: serverUser.nickname || serverUser.name || 'Unknown',
            tag: serverUser.tag || '',
            createdAt: new Date(serverUser.createdAt || Date.now()),
            publicKey: serverUser.publicKey || '',
            avatar: serverUser.avatar,
            bio: serverUser.bio
          };
          allMatches.push(user);
        }
      }
      return allMatches;
    }
  } catch (error) {
    console.error('Error searching users on server:', error);
    // Return local and IndexedDB results if server search fails
  }

  return localAndIndexedMatches;
};

// Updated function to search users by partial tag match in localStorage only
export const searchUsersByTagLocal = (tagQuery: string): User[] => {
  const normalizedQuery = tagQuery.toLowerCase();
  const localUsers = getAllUsersLocal();
  return localUsers.filter(user => 
    user.tag.toLowerCase().includes(normalizedQuery)
  );
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const normalizedEmail = email.toLowerCase();
  
  // Try localStorage first (works across ports)
  const user = getUserByEmailLocal(normalizedEmail);
  if (user) return user;
  
  // Fallback to IndexedDB
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('users', 'readonly');
  const index = tx.objectStore('users').index('email');
  
  return new Promise((resolve, reject) => {
    const request = index.get(normalizedEmail);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  // Try localStorage first (works across ports)
  const localUsers = getAllUsersLocal();
  if (localUsers && localUsers.length > 0) return localUsers;
  
  // Fallback to IndexedDB
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const saveChat = async (chat: Chat): Promise<void> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('chats', 'readwrite');
  const store = tx.objectStore('chats');
  store.put(chat);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getChat = async (id: string): Promise<Chat | undefined> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('chats', 'readonly');
  const store = tx.objectStore('chats');
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllChats = async (): Promise<Chat[]> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('chats', 'readonly');
  const store = tx.objectStore('chats');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const chats = (request.result || []) as Chat[];
      chats.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      resolve(chats);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getChatsByUser = async (userId: string): Promise<Chat[]> => {
  const chats = await getAllChats();
  return chats.filter(chat => chat.participantIds.includes(userId));
};

export const saveMessage = async (message: Message): Promise<void> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction(['messages', 'chats'], 'readwrite');
  
  const msgStore = tx.objectStore('messages');
  msgStore.put(message);

  const chatStore = tx.objectStore('chats');
  const chatRequest = chatStore.get(message.chatId);
  
  chatRequest.onsuccess = () => {
    const chat = chatRequest.result;
    if (chat) {
      chat.lastMessage = message;
      chatStore.put(chat);
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getMessagesByChat = async (chatId: string): Promise<Message[]> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('messages', 'readonly');
  const index = tx.objectStore('messages').index('chatId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(chatId);
    request.onsuccess = () => {
      const messages = (request.result || []) as Message[];
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
};

export const searchMessages = async (chatId: string, query: string): Promise<Message[]> => {
  const messages = await getMessagesByChat(chatId);
  return messages.filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()));
};

export const getMessagesByDate = async (chatId: string, date: Date): Promise<Message[]> => {
  const messages = await getMessagesByChat(chatId);
  const targetDate = date.toDateString();
  return messages.filter(msg => new Date(msg.timestamp).toDateString() === targetDate);
};

export const saveFile = async (file: FileRecord): Promise<void> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.put(file);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getFilesByChat = async (chatId: string): Promise<FileRecord[]> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('files', 'readonly');
  const index = tx.objectStore('files').index('chatId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(chatId);
    request.onsuccess = () => {
      const files = (request.result || []) as FileRecord[];
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveAuthToken = async (token: AuthToken): Promise<void> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('authTokens', 'readwrite');
  const store = tx.objectStore('authTokens');
  store.put(token);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAuthToken = async (email: string): Promise<AuthToken | undefined> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  const tx = db.transaction('authTokens', 'readonly');
  const store = tx.objectStore('authTokens');
  
  return new Promise((resolve, reject) => {
    const request = store.get(email.toLowerCase());
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const setLocalData = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Ошибка при сохранении в localStorage:', error);
  }
};

export const getLocalData = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Ошибка при чтении из localStorage:', error);
    return null;
  }
};

export const removeLocalData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Ошибка при удалении из localStorage:', error);
  }
};

// User localStorage persistent storage (cross-port)
const USERS_STORAGE_KEY = 'messenger_users';

export const getAllUsersLocal = (): User[] => {
  const users = getLocalData(USERS_STORAGE_KEY);
  return users || [];
};

export const saveUserLocal = (user: User): void => {
  const users = getAllUsersLocal();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  setLocalData(USERS_STORAGE_KEY, users);
};

export const getUserByEmailLocal = (email: string): User | undefined => {
  const users = getAllUsersLocal();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const getUserByTagLocal = (tag: string): User | undefined => {
  const users = getAllUsersLocal();
  return users.find(u => u.tag.toLowerCase() === tag.toLowerCase());
};

export const getCurrentUser = (): User | null => {
  return getLocalData('currentUser');
};

export const setCurrentUser = (user: User): void => {
  setLocalData('currentUser', user);
};

export const clearAllData = async (): Promise<void> => {
  try {
    if (!db) throw new Error('База данных не инициализирована');
    
    const tx = db.transaction(['users', 'chats', 'messages', 'files', 'authTokens'], 'readwrite');
    tx.objectStore('users').clear();
    tx.objectStore('chats').clear();
    tx.objectStore('messages').clear();
    tx.objectStore('files').clear();
    tx.objectStore('authTokens').clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        localStorage.clear();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Ошибка при очистке данных:', error);
    throw error;
  }
};
