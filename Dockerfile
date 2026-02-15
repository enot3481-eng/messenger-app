FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY ./backend ./backend

# Install dependencies
RUN cd backend && npm install

# Build the project
RUN cd backend && npm run build

EXPOSE $PORT

CMD ["sh", "-c", "cd backend && npm start"]