import { FileChangeMessage, AnalyticsData } from '../types';
import FileChangeMessageModel from '../models/FileChangeMessage';

class AnalyticsService {
  private readonly maxRecentMessages = 100;

  async addMessage(message: FileChangeMessage): Promise<void> {
    try {
      await FileChangeMessageModel.create(message);
    } catch (error) {
      console.error('Error saving message to database:', error);
      throw error;
    }
  }

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const [
        totalMessages,
        messagesByType,
        messagesByHour,
        recentMessages,
        averageMessagesPerHour
      ] = await Promise.all([
        this.getTotalMessages(),
        this.getMessagesByType(),
        this.getMessagesByHour(),
        this.getRecentMessages(),
        this.calculateAverageMessagesPerHour()
      ]);

      return {
        totalMessages,
        messagesByType,
        messagesByHour,
        recentMessages,
        averageMessagesPerHour,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  private async getTotalMessages(): Promise<number> {
    return await FileChangeMessageModel.countDocuments();
  }

  private async getMessagesByType(): Promise<Record<string, number>> {
    const results = await FileChangeMessageModel.aggregate([
      {
        $group: {
          _id: '$changeType',
          count: { $sum: 1 }
        }
      }
    ]);

    return results.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getMessagesByHour(): Promise<Record<string, number>> {
    const results = await FileChangeMessageModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%dT%H',
              date: { $toDate: '$timestamp' }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return results.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getRecentMessages(): Promise<FileChangeMessage[]> {
    const messages = await FileChangeMessageModel
      .find()
      .sort({ timestamp: -1 })
      .limit(this.maxRecentMessages)
      .lean();

    return messages.map((msg: any) => ({
      filePath: msg.filePath,
      fileName: msg.fileName,
      fileExtension: msg.fileExtension,
      directory: msg.directory,
      fileType: msg.fileType,
      category: msg.category,
      changeType: msg.changeType,
      timestamp: msg.timestamp,
      size: msg.size,
      isDirectory: msg.isDirectory
    }));
  }

  private async calculateAverageMessagesPerHour(): Promise<number> {
    const totalMessages = await this.getTotalMessages();
    if (totalMessages === 0) return 0;

    const oldestMessage = await FileChangeMessageModel
      .findOne()
      .sort({ timestamp: 1 })
      .lean();

    if (!oldestMessage) return 0;

    const now = Date.now();
    const timeSpanHours = (now - oldestMessage.timestamp) / (60 * 60 * 1000);
    
    return timeSpanHours > 0 ? totalMessages / timeSpanHours : 0;
  }

  async reset(): Promise<void> {
    try {
      await FileChangeMessageModel.deleteMany({});
    } catch (error) {
      console.error('Error resetting analytics data:', error);
      throw error;
    }
  }
}

export default AnalyticsService;