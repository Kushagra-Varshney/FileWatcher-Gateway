import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import KafkaService from './services/kafka';
import EnhancedAnalyticsService from './services/enhancedAnalytics';
import DatabaseService from './services/database';
import MessageController from './controllers/messageController';
import DashboardController from './controllers/dashboardController';
import createMessageRoutes from './routes/messages';
import createDashboardRoutes from './routes/dashboard';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { KafkaConfig } from './types';

dotenv.config();

class App {
  private app: express.Application;
  private kafkaService!: KafkaService;
  private analyticsService!: EnhancedAnalyticsService;
  private databaseService!: DatabaseService;
  private messageController!: MessageController;
  private dashboardController!: DashboardController;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.initializeControllers();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices(): void {
    const kafkaConfig: KafkaConfig = {
      clientId: process.env.KAFKA_CLIENT_ID || 'nazarts-gateway',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      topic: process.env.KAFKA_TOPIC || 'file-changes',
    };

    this.kafkaService = new KafkaService(kafkaConfig);
    this.analyticsService = new EnhancedAnalyticsService();
    this.databaseService = new DatabaseService(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/nazarts-gateway',
      process.env.MONGODB_DB_NAME || 'nazarts-gateway'
    );
  }

  private initializeControllers(): void {
    this.messageController = new MessageController(
      this.kafkaService,
      this.analyticsService
    );
    this.dashboardController = new DashboardController(
      this.analyticsService,
      this.databaseService
    );
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use('/api/messages', createMessageRoutes(this.messageController));
    this.app.use('/api/dashboard', createDashboardRoutes(this.dashboardController));
    
    this.app.get('/', (req, res) => {
      res.json({
        name: 'NazarTs Gateway',
        version: '1.0.0',
        description: 'Gateway orchestrator for producer-consumer architecture',
        endpoints: {
          'POST /api/messages/publish': 'Publish file change messages to Kafka',
          'GET /api/dashboard/analytics': 'Get analytics data (optional ?clientMacAddress filter)',
          'GET /api/dashboard/health': 'Health check endpoint',
          'GET /api/dashboard/clients': 'Get list of unique clients/hosts',
          'GET /api/dashboard/clients/:clientMacAddress': 'Get analytics for specific client'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await this.databaseService.connect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      process.exit(1);
    }

    try {
      await this.kafkaService.connect();
    } catch (error) {
      console.warn('Failed to connect to Kafka, continuing without Kafka:', error);
    }
      
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`🚀 NazarTs Gateway server started on port ${port}`);
      console.log(`📊 Dashboard available at http://localhost:${port}/api/dashboard/analytics`);
      console.log(`💚 Health check at http://localhost:${port}/api/dashboard/health`);
    });
  }

  public async stop(): Promise<void> {
    try {
      await this.kafkaService.disconnect();
      await this.databaseService.disconnect();
      console.log('Server stopped gracefully');
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }
}

const app = new App();

process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await app.stop();
  process.exit(0);
});

app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

export default app;