# Деплой на Vercel

## Важное замечание
Vercel не поддерживает WebSocket-соединения напрямую. Поэтому для полнофункционального мессенджера вам нужно:

1. Разместить фронтенд (React приложение) на Vercel
2. Разместить бэкенд (WebSocket сервер) на другом сервисе, поддерживающем WebSocket (например, Railway, Render, AWS, DigitalOcean)

## Подготовка к деплою

1. Убедитесь, что ваш WebSocket сервер запущен где-то публично (например, на Railway)
2. Получите URL вашего WebSocket сервера (например, wss://my-messenger-backend.onrender.com)

## Настройка Vercel

1. Зайдите на сайт vercel.com и создайте новую команду
2. Импортируйте этот репозиторий GitHub
3. В настройках проекта добавьте переменную окружения:
   - Key: `VITE_WS_SERVER_URL`
   - Value: URL вашего WebSocket сервера (например, wss://my-messenger-backend.onrender.com)

## Автоматическая сборка

Vercel автоматически выполнит:
- `npm install` 
- `npm run build` (команда из package.json)
- Размещение статических файлов

## Альтернативные решения

Если вам нужна вся функциональность на одном хостинге, рассмотрите:
- Heroku (поддерживает WebSocket)
- Railway
- Render
- DigitalOcean App Platform