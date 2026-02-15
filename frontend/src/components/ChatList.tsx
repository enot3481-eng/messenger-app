import React, { useState } from 'react';
import { Chat } from '../types';
import { useApp } from '../context/AppContext';
import '../styles/ChatList.css';

export const ChatList: React.FC = () => {
  const { chats, selectedChat, selectChat, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const getChatName = (chat: Chat): string => {
    if (chat.isGroup && chat.groupName) return chat.groupName;
    const otherUser = chat.participantDetails.find(u => u.id !== currentUser?.id);
    return otherUser?.nickname || 'Чат';
  };

  const filteredChats = chats.filter(chat => 
    getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Чаты</h2>
        <button className="new-chat-btn">+</button>
      </div>

      <input
        type="text"
        className="chat-search"
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="chats">
        {filteredChats.map((chat) => {
          const chatName = getChatName(chat);
          const lastMsg = chat.lastMessage ? (typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage.content) : 'Нет сообщений';
          return (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => selectChat(chat.id)}
            >
              <div className="chat-avatar">
                {chatName.charAt(0).toUpperCase()}
              </div>
              <div className="chat-info">
                <h3>{chatName}</h3>
                <p className="chat-preview">{lastMsg}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
