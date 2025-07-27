import { Request, Response } from 'express';
import { FileChangeMessage } from '../types';
import KafkaService from '../services/kafka';
import EnhancedAnalyticsService from '../services/enhancedAnalytics';

class MessageController {
  constructor(
    private kafkaService: KafkaService,
    private analyticsService: EnhancedAnalyticsService
  ) {}

  async receiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const message: FileChangeMessage = req.body;

      if (!this.validateMessage(message)) {
        res.status(400).json({ 
          error: 'Invalid message format',
          required: ['filePath', 'fileName', 'fileExtension', 'directory', 'fileType', 'category', 'changeType', 'timestamp', 'size', 'isDirectory', 'clientMacAddress']
        });
        return;
      }

      message.timestamp = message.timestamp || Date.now();

      await this.kafkaService.publishMessage(message);

      res.status(200).json({ 
        success: true, 
        message: 'Message published successfully',
        messageId: `${message.filePath}-${message.timestamp}`
      });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private validateMessage(message: any): message is FileChangeMessage {
    return (
      typeof message === 'object' &&
      typeof message.filePath === 'string' &&
      typeof message.fileName === 'string' &&
      typeof message.fileExtension === 'string' &&
      typeof message.directory === 'string' &&
      typeof message.fileType === 'string' &&
      ['document', 'image', 'video', 'audio', 'code', 'archive', 'other'].includes(message.fileType) &&
      typeof message.category === 'string' &&
      ['document', 'media', 'code', 'archive', 'other'].includes(message.category) &&
      typeof message.changeType === 'string' &&
      ['add', 'change', 'unlink', 'addDir', 'unlinkDir'].includes(message.changeType) &&
      typeof message.timestamp === 'number' &&
      typeof message.size === 'number' &&
      typeof message.isDirectory === 'boolean' &&
      typeof message.clientMacAddress === 'string' &&
      message.clientMacAddress.length > 0
    );
  }
}

export default MessageController;