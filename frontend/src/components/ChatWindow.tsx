import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Message } from '../types';
import { Icon } from './Icon';
import '../styles/ChatWindow.css';

interface ChatWindowProps {
  chatId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { selectedChat, messages, sendMessage, currentUser, loadMessages } = useApp();
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showVoiceButton, setShowVoiceButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Get the other participant (not current user)
  const otherParticipant = selectedChat.participantDetails.find(
    user => user.id !== currentUser?.id
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{otherParticipant?.nickname || 'Чат'}</h2>
        <button className="call-btn">📞</button>
      </div>

      <div className="messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-bubble">Добро пожаловать в чат! 👋</div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.senderId === currentUser?.id ? 'sent' : 'received'}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="file"
          id="file-input"
          ref={fileInputRef}
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="file-btn attachment-btn">
          <Icon name="clip" size={24} />
        </label>

        <div className="input-container">
          <input
            type="text"
            placeholder="Введите сообщение..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onFocus={() => setShowVoiceButton(false)}
            onBlur={() => setTimeout(() => setShowVoiceButton(false), 200)}
          />
          
          <button 
            type="button" 
            className="voice-toggle-btn"
            onMouseDown={() => setShowVoiceButton(true)}
            onMouseUp={() => setTimeout(() => setShowVoiceButton(false), 1000)}
            onMouseLeave={() => setTimeout(() => setShowVoiceButton(false), 1000)}
          >
            <Icon name="micro" size={20} />
          </button>
        </div>

        <button type="submit" className="send-btn">
          <Icon name="send" size={20} />
        </button>
      </form>

      {showVoiceButton && (
        <div className="voice-message-popup">
          <button className="voice-message-btn">🎤 Голосовое сообщение</button>
        </div>
      )}
    </div>
  );
};