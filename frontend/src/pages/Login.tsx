import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { User } from '../types';
import {
  saveUser,
  initDatabase,
  getUserByEmail
} from '../services/storageService';
import {
  hashPassword,
  generateId
} from '../services/encryptionService';
import { useApp } from '../context/AppContext';
import { websocketService } from '../services/websocketService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUserData } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (loading) return;
    if (!email || !password || !nickname || !tag) {
      setError('Заполните все поля');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      await initDatabase();
      const existing = await getUserByEmail(email);
      if (existing) {
        setError('Этот email уже зарегистрирован');
        setLoading(false);
        return;
      }

      const userId = generateId();
      const passwordHash = hashPassword(password);

      const normalizedTag = tag.startsWith('@') ? tag : `@${tag}`;
      const newUser: User = {
        id: userId,
        email: email.toLowerCase(),
        nickname,
        tag: normalizedTag,
        createdAt: new Date(),
        publicKey: passwordHash,
        isOnline: true
      };

      await saveUser(newUser);
      setCurrentUserData(newUser);
      
      // Connect to WebSocket server and send user info
      try {
        await websocketService.connect();
        websocketService.userOnline(newUser.id, {
          id: newUser.id,
          email: newUser.email,
          nickname: newUser.nickname,
          tag: newUser.tag,
          avatar: newUser.avatar,
          bio: newUser.bio,
          createdAt: newUser.createdAt,
          publicKey: newUser.publicKey
        });
      } catch (wsErr) {
        console.error('WebSocket connection error:', wsErr);
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (loading) return;
    if (!email || !password) {
      setError('Заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      await initDatabase();
      const user = await getUserByEmail(email);
      if (!user) {
        setError('Пользователь не найден');
        setLoading(false);
        return;
      }
      const passwordHash = hashPassword(password);
      if (passwordHash !== user.publicKey) {
        setError('Неверный пароль');
        setLoading(false);
        return;
      }
      setCurrentUserData(user);
      
      // Connect to WebSocket server and send user info
      try {
        await websocketService.connect();
        websocketService.userOnline(user.id, {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          tag: user.tag,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
          publicKey: user.publicKey
        });
      } catch (wsErr) {
        console.error('WebSocket connection error:', wsErr);
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Messenger</h1>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <h2>Вход</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
            <p className="toggle-auth">
              Нет аккаунта?{' '}
              <button type="button" onClick={() => { setMode('register'); setError(''); }}>
                Зарегистрироваться
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Регистрация</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Тег (@username)"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Загрузка...' : 'Далее'}
            </button>
            <p className="toggle-auth">
              Уже есть аккаунт?{' '}
              <button type="button" onClick={() => { setMode('login'); setError(''); }}>
                Войти
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
