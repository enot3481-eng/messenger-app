import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Chat } from '../types';
import { getUserByTag, searchUsersByTag, saveUser, saveChat } from '../services/storageService';
import { generateId } from '../services/encryptionService';
import { ChatWindow } from '../components/ChatWindow';
import { Icon } from '../components/Icon';
import '../styles/Dashboard.css';

export const Dashboard: React.FC = () => {
  const { currentUser, chats, selectChat, selectedChat, setCurrentUserData, loadChats } = useApp() as any;
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [editTag, setEditTag] = useState('');
  const [editBio, setEditBio] = useState('');

  const [userResults, setUserResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Filter chats by name or participant tag
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    if (q.startsWith('@')) {
      // If searching by tag, return empty chat list
      return [];
    }
    
    if (!q) {
      return chats || [];
    }
    
    return (chats || []).filter((c: any) => {
      const title = c.groupName || (c.participantDetails && c.participantDetails.map((p: any) => p.nickname).join(' ')) || '';
      const tags = (c.participantDetails || []).map((p: any) => p.tag).join(' ');
      return title.toLowerCase().includes(q) || tags.toLowerCase().includes(q);
    });
  }, [chats, search]);

  // Effect to search users by tag
  useEffect(() => {
    const q = search.trim().toLowerCase();
    
    if (q.startsWith('@')) {
      const tagQuery = q.substring(1); // Remove @ symbol
      if (tagQuery) {
        searchUsersByTag(tagQuery)
          .then(foundUsers => {
            const filteredUsers = foundUsers.filter(user => user.id !== currentUser?.id);
            setUserResults(filteredUsers);
          })
          .catch(error => {
            console.error('Error searching users by tag:', error);
            setUserResults([]);
          });
      } else {
        setUserResults([]);
      }
    } else {
      // Clear user results when not searching by tag
      setUserResults([]);
    }
  }, [search, currentUser]);

  const openProfile = () => {
    setEditTag(currentUser?.tag || '');
    setEditBio(currentUser?.bio || '');
    setAvatarPreview(currentUser?.avatar);
    setShowProfile(true);
  };

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    const data = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result));
      reader.readAsDataURL(file);
    });
    setAvatarPreview(data);
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: avatarPreview, tag: editTag, bio: editBio };
    setCurrentUserData(updated);
    
    // Also save to storage to ensure persistence
    try {
      await saveUser(updated);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
    
    setShowProfile(false);
  };

  const openChatWithUser = async (user: User) => {
    // Find existing chat with this user
    const existingChat = chats.find((chat: Chat) => 
      chat.participantIds.includes(user.id) && chat.participantIds.includes(currentUser?.id || '')
    );

    if (existingChat) {
      // Select existing chat
      await selectChat(existingChat.id);
    } else {
      // Create new chat
      const newChatId = generateId();
      const newChat: Chat = {
        id: newChatId,
        participantIds: [currentUser?.id || '', user.id],
        participantDetails: [currentUser!, user],
        messages: [],
        createdAt: new Date(),
        isGroup: false,
        unreadCount: 0
      };

      // Save new chat to storage
      try {
        await saveChat(newChat);
        // Reload chats to include the new one
        await loadChats();
        // Select the new chat
        await selectChat(newChatId);
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Messenger</h1>
        <button className="profile-btn" onClick={openProfile} aria-label="Profile">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="profile" />
          ) : (
            <span className="profile-emoji">👤</span>
          )}
        </button>
      </div>

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="search-wrap">
            <input
              className="chat-search"
              placeholder="Поиск чатов или @тег"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="chat-list">
            {/* Display user search results if searching by tag */}
            {search.trim().toLowerCase().startsWith('@') && userResults.length > 0 ? (
              <div className="user-search-results">
                <h3>Пользователи</h3>
                {userResults.map((user: User) => (
                  <div key={user.id} className="user-result-item chat-item" onClick={() => {
                    setSelectedUser(user);
                    setShowUserProfile(true);
                  }}>
                    <div className="chat-title">{user.nickname}</div>
                    <div className="chat-last">{user.tag}</div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="empty-chats">Новых чатов нет</div>
            ) : (
              filteredChats.map((chat: any) => (
                <div key={chat.id} className="chat-item" onClick={() => selectChat(chat.id)}>
                  <div className="chat-title">{chat.groupName || chat.participantDetails?.map((p: any) => p.nickname).join(', ')}</div>
                  <div className="chat-last">{chat.lastMessage?.content || ''}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="dashboard-main">
          {selectedChat ? (
            <ChatWindow chatId={selectedChat.id} />
          ) : (
            <div className="no-chat-selected welcome">
              <div className="welcome-bubble">Добро пожаловать, {currentUser?.nickname}! 👋</div>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <div className="profile-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Профиль</h3>
            <div className="avatar-row">
              <div className="avatar-preview">
                {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : <div className="avatar-placeholder">👤</div>}
              </div>
              <div className="avatar-actions">
                <input id="avatarFile" type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
                <label htmlFor="avatarFile" className="btn">Изменить фото</label>
              </div>
            </div>
            <label>Тег</label>
            <input value={editTag} onChange={(e) => setEditTag(e.target.value)} />
            <label>О себе</label>
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
            <div className="popup-actions">
              <button className="btn" onClick={saveProfile}>Сохранить</button>
              <button className="btn btn-ghost" onClick={() => setShowProfile(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="profile-overlay" onClick={() => setShowUserProfile(false)}>
          <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
            <div className="user-profile-view">
              <div className="user-avatar-large">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.nickname} />
                ) : null}
                <div className="avatar-placeholder-large" style={selectedUser.avatar ? { display: 'none' } : { display: 'flex' }}>
                  {selectedUser.nickname?.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <h2>{selectedUser.nickname}</h2>
              
              <div className="user-profile-actions">
                <button className="action-btn message-btn" onClick={() => {
                  // Close profile modal
                  setShowUserProfile(false);
                  // Open chat with selected user
                  openChatWithUser(selectedUser);
                }}>
                  <Icon name="chat" size={24} />
                </button>
                <button className="action-btn call-btn">
                  <Icon name="call" size={24} />
                </button>
                <button className="action-btn video-call-btn">
                  <Icon name="video" size={24} />
                </button>
              </div>
              
              <div className="user-profile-details">
                <p><strong>Тег:</strong> {selectedUser.tag}</p>
                <p><strong>Описание:</strong> {selectedUser.bio || 'Нет описания'}</p>
              </div>
              
              <button className="close-profile-btn" onClick={() => setShowUserProfile(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
