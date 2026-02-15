import React, { useState } from 'react';
import { Message } from '../types';
import '../styles/ChatSearch.css';

interface ChatSearchProps {
  messages: Message[];
  onClose: () => void;
}

export const ChatSearch: React.FC<ChatSearchProps> = ({ messages, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const results = messages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-search-modal">
      <div className="chat-search-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <input
          type="text"
          className="search-input"
          placeholder="Поиск в чате..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />

        <div className="search-results">
          {results.length === 0 ? (
            <div className="no-results">Сообщений не найдено</div>
          ) : (
            results.map((msg) => (
              <div key={msg.id} className="search-result-item">
                <strong>{msg.senderName}</strong>
                <p>{msg.content}</p>
                <small>{new Date(msg.timestamp).toLocaleTimeString('ru-RU')}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
