import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/Dashboard.css';

export const Dashboard: React.FC = () => {
  const { currentUser, chats, selectChat, selectedChat, setCurrentUserData } = useApp() as any;
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [editTag, setEditTag] = useState('');
  const [editBio, setEditBio] = useState('');

  // filter chats by name or participant tag
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats || [];
    return (chats || []).filter((c: any) => {
      const title = c.groupName || (c.participantDetails && c.participantDetails.map((p: any) => p.nickname).join(' ')) || '';
      const tags = (c.participantDetails || []).map((p: any) => p.tag).join(' ');
      return title.toLowerCase().includes(q) || tags.toLowerCase().includes(q);
    });
  }, [chats, search]);

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

  const saveProfile = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: avatarPreview, tag: editTag, bio: editBio };
    setCurrentUserData(updated);
    setShowProfile(false);
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
            {filteredChats.length === 0 ? (
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
          <div className="no-chat-selected welcome">
            <div className="welcome-bubble">Добро пожаловать, {currentUser?.nickname}! 👋</div>
          </div>
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
    </div>
  );
};
