FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY ./backend ./backend

# Install dependencies
RUN cd backend && npm install --production=false

# Build the project
RUN cd backend && npm run build

# Expose port
EXPOSE 8080

CMD ["sh", "-c", "cd backend && npm start"]