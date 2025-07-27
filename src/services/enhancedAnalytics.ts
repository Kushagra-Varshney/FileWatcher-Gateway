import ProcessedFileModel from '../models/FileChangeMessage';
import FileProcessor from '../utils/fileProcessor';
import {
  DashboardData,
  BasicStats,
  CategoryStat,
  ExtensionStat,
  HourlyAnalytics,
  DailyAnalytics,
  DirectoryAnalytics,
  FileTypeAnalytics,
  WeeklyTrends,
  FileChangeMessage,
  ClientAnalytics,
  ClientInfo
} from '../types';

class EnhancedAnalyticsService {
  async addMessage(message: FileChangeMessage): Promise<void> {
    try {
      const processedData = FileProcessor.processFileMessage(message);
      await ProcessedFileModel.create(processedData);
    } catch (error) {
      console.error('Error saving processed file data:', error);
      throw error;
    }
  }

  async getDashboardData(clientMacAddress?: string): Promise<DashboardData> {
    try {
      const [
        basicStats,
        categories,
        topExtensions,
        hourlyAnalytics,
        dailyAnalytics,
        topDirectories,
        fileTypes,
        weeklyTrends,
        topClients,
        clients
      ] = await Promise.all([
        this.getBasicStats(clientMacAddress),
        this.getCategoryStats(clientMacAddress),
        this.getTopExtensions(clientMacAddress),
        this.getHourlyAnalytics(clientMacAddress),
        this.getDailyAnalytics(clientMacAddress),
        this.getTopDirectories(clientMacAddress),
        this.getFileTypeAnalytics(clientMacAddress),
        this.getWeeklyTrends(clientMacAddress),
        this.getTopClients(),
        this.getUniqueClients()
      ]);

      return {
        dashboard: {
          stats: {
            basic: basicStats,
            categories,
            topExtensions
          },
          analytics: {
            hourly: hourlyAnalytics,
            daily: dailyAnalytics,
            topDirectories,
            topClients
          },
          fileTypes,
          weeklyTrends,
          clients
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  private async getBasicStats(clientMacAddress?: string): Promise<BasicStats> {
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    const [totalEvents, directoriesResult, filesResult, totalSizeResult, changeTypeCounts] = await Promise.all([
      ProcessedFileModel.countDocuments(clientFilter),
      ProcessedFileModel.countDocuments({ ...clientFilter, isDirectory: true }),
      ProcessedFileModel.countDocuments({ ...clientFilter, isDirectory: false }),
      ProcessedFileModel.aggregate([
        { $match: { ...clientFilter, isDirectory: false } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]),
      ProcessedFileModel.aggregate([
        { $match: clientFilter },
        {
          $group: {
            _id: '$changeType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalSize = totalSizeResult[0]?.total || 0;
    const changeTypeMap = changeTypeCounts.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      total_events: totalEvents,
      directories: directoriesResult,
      files: filesResult,
      total_size: totalSize,
      files_created: (changeTypeMap['add'] || 0) + (changeTypeMap['addDir'] || 0),
      files_modified: changeTypeMap['change'] || 0,
      files_deleted: (changeTypeMap['unlink'] || 0) + (changeTypeMap['unlinkDir'] || 0)
    };
  }

  private async getCategoryStats(clientMacAddress?: string): Promise<CategoryStat[]> {
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, isDirectory: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total_size: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return results.map((item: any) => ({
      category: item._id,
      count: item.count,
      total_size: item.total_size
    }));
  }

  private async getTopExtensions(clientMacAddress?: string): Promise<ExtensionStat[]> {
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, isDirectory: false, fileExtension: { $ne: 'none' } } },
      {
        $group: {
          _id: '$fileExtension',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return results.map((item: any) => ({
      extension: item._id,
      count: item.count
    }));
  }

  private async getHourlyAnalytics(clientMacAddress?: string): Promise<HourlyAnalytics[]> {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, timestamp: { $gte: twentyFourHoursAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%H',
              date: { $toDate: '$timestamp' }
            }
          },
          event_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return results.map((item: any) => ({
      hour: item._id,
      event_count: item.event_count
    }));
  }

  private async getDailyAnalytics(clientMacAddress?: string): Promise<DailyAnalytics[]> {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $toDate: '$timestamp' }
              }
            }
          },
          event_count: { $sum: 1 },
          created: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['add', 'addDir']] },
                1,
                0
              ]
            }
          },
          modified: {
            $sum: {
              $cond: [
                { $eq: ['$changeType', 'change'] },
                1,
                0
              ]
            }
          },
          deleted: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['unlink', 'unlinkDir']] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return results.map((item: any) => ({
      date: item._id.date,
      event_count: item.event_count,
      created: item.created,
      modified: item.modified,
      deleted: item.deleted
    }));
  }

  private async getTopDirectories(clientMacAddress?: string): Promise<DirectoryAnalytics[]> {
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    const results = await ProcessedFileModel.aggregate([
      { $match: clientFilter },
      {
        $group: {
          _id: '$directory',
          event_count: { $sum: 1 },
          last_activity: { $max: '$timestamp' }
        }
      },
      { $sort: { event_count: -1 } },
      { $limit: 10 }
    ]);

    return results.map((item: any) => ({
      directory: item._id || '',
      event_count: item.event_count,
      last_activity: new Date(item.last_activity).toISOString()
    }));
  }

  private async getFileTypeAnalytics(clientMacAddress?: string): Promise<FileTypeAnalytics[]> {
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, isDirectory: false } },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          total_size: { $sum: '$size' }
        }
      },
      {
        $addFields: {
          avg_size: { $divide: ['$total_size', '$count'] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return results.map((item: any) => ({
      file_type: item._id,
      count: item.count,
      total_size: item.total_size,
      avg_size: Math.round(item.avg_size * 100) / 100
    }));
  }

  private async getWeeklyTrends(clientMacAddress?: string): Promise<WeeklyTrends[]> {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const clientFilter = clientMacAddress ? { clientMacAddress } : {};
    
    const results = await ProcessedFileModel.aggregate([
      { $match: { ...clientFilter, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $toDate: '$timestamp' }
              }
            },
            day_of_week: {
              $dateToString: {
                format: '%w',
                date: { $toDate: '$timestamp' }
              }
            }
          },
          total_events: { $sum: 1 },
          created_count: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['add', 'addDir']] },
                1,
                0
              ]
            }
          },
          modified_count: {
            $sum: {
              $cond: [
                { $eq: ['$changeType', 'change'] },
                1,
                0
              ]
            }
          },
          deleted_count: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['unlink', 'unlinkDir']] },
                1,
                0
              ]
            }
          },
          total_size: { $sum: '$size' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return results.map((item: any) => ({
      date: item._id.date,
      day_of_week: item._id.day_of_week,
      total_events: item.total_events,
      created_count: item.created_count,
      modified_count: item.modified_count,
      deleted_count: item.deleted_count,
      total_size: item.total_size
    }));
  }

  private async getTopClients(): Promise<ClientAnalytics[]> {
    const results = await ProcessedFileModel.aggregate([
      {
        $group: {
          _id: '$clientMacAddress',
          event_count: { $sum: 1 },
          last_activity: { $max: '$timestamp' },
          total_size: { $sum: '$size' },
          files_created: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['add', 'addDir']] },
                1,
                0
              ]
            }
          },
          files_modified: {
            $sum: {
              $cond: [
                { $eq: ['$changeType', 'change'] },
                1,
                0
              ]
            }
          },
          files_deleted: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['unlink', 'unlinkDir']] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { event_count: -1 } },
      { $limit: 10 }
    ]);

    return results.map((item: any) => ({
      clientMacAddress: item._id,
      event_count: item.event_count,
      last_activity: new Date(item.last_activity).toISOString(),
      files_created: item.files_created,
      files_modified: item.files_modified,
      files_deleted: item.files_deleted,
      total_size: item.total_size
    }));
  }

  async getUniqueClients(): Promise<ClientInfo[]> {
    const results = await ProcessedFileModel.aggregate([
      {
        $group: {
          _id: '$clientMacAddress',
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          total_events: { $sum: 1 }
        }
      },
      { $sort: { last_seen: -1 } }
    ]);

    return results.map((item: any) => ({
      clientMacAddress: item._id,
      first_seen: new Date(item.first_seen).toISOString(),
      last_seen: new Date(item.last_seen).toISOString(),
      total_events: item.total_events
    }));
  }

  async getClientAnalytics(clientMacAddress: string): Promise<ClientAnalytics | null> {
    const results = await ProcessedFileModel.aggregate([
      { $match: { clientMacAddress } },
      {
        $group: {
          _id: '$clientMacAddress',
          event_count: { $sum: 1 },
          last_activity: { $max: '$timestamp' },
          total_size: { $sum: '$size' },
          files_created: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['add', 'addDir']] },
                1,
                0
              ]
            }
          },
          files_modified: {
            $sum: {
              $cond: [
                { $eq: ['$changeType', 'change'] },
                1,
                0
              ]
            }
          },
          files_deleted: {
            $sum: {
              $cond: [
                { $in: ['$changeType', ['unlink', 'unlinkDir']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    if (results.length === 0) return null;

    const item = results[0];
    return {
      clientMacAddress: item._id,
      event_count: item.event_count,
      last_activity: new Date(item.last_activity).toISOString(),
      files_created: item.files_created,
      files_modified: item.files_modified,
      files_deleted: item.files_deleted,
      total_size: item.total_size
    };
  }

  async reset(): Promise<void> {
    try {
      await ProcessedFileModel.deleteMany({});
    } catch (error) {
      console.error('Error resetting analytics data:', error);
      throw error;
    }
  }
}

export default EnhancedAnalyticsService;