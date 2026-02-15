import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/UserProfile.css';

export const UserProfile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="profile-modal">
      <div className="profile-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="profile-avatar">
          {currentUser.nickname.charAt(0).toUpperCase()}
        </div>

        <h2>{currentUser.nickname}</h2>
        <p className="profile-tag">{currentUser.tag}</p>
        <p className="profile-email">{currentUser.email}</p>

        <div className="profile-stats">
          <div className="stat">
            <span className="stat-label">Присоединился</span>
            <span className="stat-value">
              {new Date(currentUser.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={() => {
          localStorage.removeItem('currentUser');
          window.location.reload();
        }}>
          Выход
        </button>
      </div>
    </div>
  );
};
