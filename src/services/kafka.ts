import { Kafka, Producer } from 'kafkajs';
import { KafkaConfig, FileChangeMessage } from '../types';

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private config: KafkaConfig;

  constructor(config: KafkaConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log('Kafka producer connected successfully');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      // throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Failed to disconnect from Kafka:', error);
      // throw error;
    }
  }

  async publishMessage(message: FileChangeMessage): Promise<void> {
    try {
      await this.producer.send({
        topic: this.config.topic,
        messages: [
          {
            key: message.filePath,
            value: JSON.stringify(message),
            timestamp: message.timestamp.toString(),
          },
        ],
      });
      console.log(`Message published for file: ${message.filePath}`);
    } catch (error) {
      console.error('Failed to publish message:', error);
      // throw error;
    }
  }
}

export default KafkaService;