export interface User {
  id: string;
  email: string;
  nickname: string;
  tag: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  publicKey: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'audio' | 'video' | 'file' | 'call';
  timestamp: Date;
  isRead: boolean;
  isEncrypted: boolean;
  fileData?: {
    name: string;
    size: number;
    mimeType: string;
    url: string;
    uploadedAt: Date;
  };
  callData?: {
    duration: number;
    type: 'audio' | 'video';
    status: 'missed' | 'completed' | 'declined';
  };
}

export interface Chat {
  id: string;
  participantIds: string[];
  participantDetails: User[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: Date;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  unreadCount: number;
}

export interface AuthToken {
  email: string;
  secret: string;
  backupCodes: string[];
  createdAt: Date;
}

export interface FileRecord {
  id: string;
  chatId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  messageId: string;
}

export interface SearchResult {
  messages: Message[];
  users: User[];
  files: Message[];
}
