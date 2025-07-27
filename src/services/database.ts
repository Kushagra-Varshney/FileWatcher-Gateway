import mongoose from 'mongoose';

class DatabaseService {
  private mongoUri: string;
  private dbName: string;

  constructor(mongoUri: string, dbName?: string) {
    this.mongoUri = mongoUri;
    this.dbName = dbName || 'nazar-analytics';
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.mongoUri, {
        dbName: this.dbName,
      });
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      if (!this.isConnected()) {
        return { status: 'disconnected' };
      }

      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          dbName: mongoose.connection.name,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export default DatabaseService;