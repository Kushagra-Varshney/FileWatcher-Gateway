# NazarTs Gateway

A TypeScript Express gateway orchestrator for producer-consumer architecture with Kafka integration and MongoDB analytics persistence.

## Overview

This gateway serves as an intermediary between file watchers (producers) and Kafka consumers, providing:
- REST API endpoints for receiving file change messages
- Kafka message publishing
- MongoDB persistent analytics storage
- Real-time analytics dashboard for monitoring
- Health check endpoints with database status

## Architecture

```
Producer (File Watcher) → Gateway → Kafka Queue → Consumer
                           ↓
                        MongoDB
                           ↓
                     Analytics Dashboard
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MongoDB:**
   ```bash
   # Make sure MongoDB is running locally on port 27017
   # Or update MONGODB_URI in .env for remote database
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Kafka and MongoDB configuration
   ```

4. **Start in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Messages
- `POST /api/messages/publish` - Publish file change messages to Kafka

### Dashboard
- `GET /api/dashboard/analytics` - Get analytics data
- `GET /api/dashboard/health` - Health check endpoint
- `GET /` - API documentation

## Message Format

```json
{
  "filePath": "/path/to/file.txt",
  "changeType": "change",
  "timestamp": 1690123456789,
  "metadata": {
    "size": 1024,
    "lastModified": 1690123456789
  }
}
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `KAFKA_BROKERS` - Comma-separated Kafka broker URLs
- `KAFKA_CLIENT_ID` - Kafka client identifier
- `KAFKA_TOPIC` - Kafka topic name
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/nazarts-gateway)
- `MONGODB_DB_NAME` - MongoDB database name (default: nazarts-gateway)
- `NODE_ENV` - Environment (development/production)

## Producer Integration

Your file watcher should send POST requests to `/api/messages/publish` with the message format above. Example using chokidar:

```typescript
import chokidar from 'chokidar';
import axios from 'axios';

const watcher = chokidar.watch('/path/to/watch');

watcher.on('all', (event, path) => {
  axios.post('http://localhost:3000/api/messages/publish', {
    filePath: path,
    changeType: event,
    timestamp: Date.now()
  });
});
```