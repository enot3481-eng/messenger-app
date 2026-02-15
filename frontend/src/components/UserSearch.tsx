import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { getUserByTag } from '../services/storageService';
import '../styles/SearchBar.css';

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const { currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Если запрос начинается с @, ищем по тегу
    if (query.startsWith('@')) {
      const tagQuery = query.substring(1); // Убираем символ @
      try {
        const user = await getUserByTag(tagQuery);
        if (user && user.id !== currentUser?.id) {
          setSearchResults([user]);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Ошибка при поиске пользователя по тегу:', error);
        setSearchResults([]);
      }
    } else {
      // В противном случае, можно реализовать поиск по никнейму
      // Пока оставим пустым результатом
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  const handleUserSelect = (user: User) => {
    onSelectUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="user-search">
      <input
        type="text"
        className="search-input"
        placeholder="Поиск пользователя (@tag)..."
        value={searchQuery}
        onChange={handleSearch}
      />
      
      {searchResults.length > 0 && (
        <div className="search-results-dropdown">
          {searchResults.map(user => (
            <div 
              key={user.id} 
              className="search-result-item" 
              onClick={() => handleUserSelect(user)}
            >
              <div className="user-avatar">{user.nickname?.charAt(0).toUpperCase() || '#'}</div>
              <div className="user-info">
                <div className="user-name">{user.nickname}</div>
                <div className="user-tag">{user.tag}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isSearching && (
        <div className="search-loading">Поиск...</div>
      )}
    </div>
  );
};