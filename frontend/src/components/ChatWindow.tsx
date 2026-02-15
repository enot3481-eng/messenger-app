import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/ChatWindow.css';

export const ChatWindow: React.FC = () => {
  const { selectedChat, messages, sendMessage, currentUser } = useApp();
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || (!messageText && !selectedFile)) return;

    await sendMessage(selectedChat.id, messageText, selectedFile || undefined);
    setMessageText('');
    setSelectedFile(null);
  };

  if (!selectedChat) {
    return <div className="chat-window empty">Выберите чат</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{selectedChat.isGroup && selectedChat.groupName ? selectedChat.groupName : selectedChat.participantDetails.find(u => u.id !== currentUser?.id)?.nickname || 'Чат'}</h2>
        <button className="call-btn">📞</button>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.type}`}>
            <div className="message-sender">{msg.senderName}</div>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="file"
          id="file-input"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="file-input" className="file-btn">📎</label>
        
        <input
          type="text"
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
};
