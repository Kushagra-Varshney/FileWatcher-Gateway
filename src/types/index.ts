export interface FileChangeMessage {
  filePath: string;
  fileName: string;
  fileExtension: string;
  directory: string;
  fileType: 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';
  category: 'document' | 'media' | 'code' | 'archive' | 'other';
  changeType: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  timestamp: number;
  size: number;
  isDirectory: boolean;
  clientMacAddress: string;
}

export interface ProcessedFileData {
  filePath: string;
  fileName: string;
  fileExtension: string;
  directory: string;
  fileType: 'document' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';
  category: 'document' | 'media' | 'code' | 'archive' | 'other';
  changeType: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  timestamp: number;
  size: number;
  isDirectory: boolean;
  clientMacAddress: string;
}

export interface BasicStats {
  total_events: number;
  directories: number;
  files: number;
  total_size: number;
  files_created: number;
  files_modified: number;
  files_deleted: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  total_size: number;
}

export interface ExtensionStat {
  extension: string;
  count: number;
}

export interface HourlyAnalytics {
  hour: string;
  event_count: number;
}

export interface DailyAnalytics {
  date: string;
  event_count: number;
  created: number;
  modified: number;
  deleted: number;
}

export interface DirectoryAnalytics {
  directory: string;
  event_count: number;
  last_activity: string;
}

export interface ClientAnalytics {
  clientMacAddress: string;
  event_count: number;
  last_activity: string;
  files_created: number;
  files_modified: number;
  files_deleted: number;
  total_size: number;
}

export interface ClientInfo {
  clientMacAddress: string;
  first_seen: string;
  last_seen: string;
  total_events: number;
}

export interface FileTypeAnalytics {
  file_type: string;
  count: number;
  total_size: number;
  avg_size: number;
}

export interface WeeklyTrends {
  date: string;
  day_of_week: string;
  total_events: number;
  created_count: number;
  modified_count: number;
  deleted_count: number;
  total_size: number;
}

export interface DashboardData {
  dashboard: {
    stats: {
      basic: BasicStats;
      categories: CategoryStat[];
      topExtensions: ExtensionStat[];
    };
    analytics: {
      hourly: HourlyAnalytics[];
      daily: DailyAnalytics[];
      topDirectories: DirectoryAnalytics[];
      topClients: ClientAnalytics[];
    };
    fileTypes: FileTypeAnalytics[];
    weeklyTrends: WeeklyTrends[];
    clients: ClientInfo[];
  };
}

export interface AnalyticsData {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByHour: Record<string, number>;
  recentMessages: FileChangeMessage[];
  averageMessagesPerHour: number;
}

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  topic: string;
}