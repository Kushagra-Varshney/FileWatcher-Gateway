import path from 'path';
import { FileChangeMessage, ProcessedFileData } from '../types';

export class FileProcessor {
  private static readonly FILE_TYPE_MAPPINGS = {
    document: ['.txt', '.doc', '.docx', '.pdf', '.rtf', '.odt', '.pages', '.md', '.csv', '.xls', '.xlsx', '.ppt', '.pptx'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.raw'],
    video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.html', '.css', '.scss', '.less', '.json', '.xml', '.yaml', '.yml', '.sql'],
    archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
  };

  private static readonly CATEGORY_MAPPINGS = {
    document: 'document' as const,
    image: 'media' as const,
    video: 'media' as const,
    audio: 'media' as const,
    code: 'code' as const,
    archive: 'archive' as const,
    other: 'other' as const,
  };

  static processFileMessage(message: FileChangeMessage): ProcessedFileData {
    const filePath = message.filePath;
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    const directory = path.dirname(filePath);
    const isDirectory = message.changeType === 'addDir' || message.changeType === 'unlinkDir';
    const size = message.size || 0;

    const fileType = this.getFileType(fileExtension);
    const category = this.getCategory(fileType);

    return {
      filePath,
      fileName,
      fileExtension: fileExtension || 'none',
      directory,
      fileType,
      category,
      changeType: message.changeType,
      timestamp: message.timestamp,
      size,
      isDirectory,
      clientMacAddress: message.clientMacAddress,
    };
  }

  private static getFileType(extension: string): ProcessedFileData['fileType'] {
    for (const [type, extensions] of Object.entries(this.FILE_TYPE_MAPPINGS)) {
      if (extensions.includes(extension)) {
        return type as ProcessedFileData['fileType'];
      }
    }
    return 'other';
  }

  private static getCategory(fileType: ProcessedFileData['fileType']): ProcessedFileData['category'] {
    return this.CATEGORY_MAPPINGS[fileType] || 'other';
  }

  static getChangeTypeMapping(changeType: string): { created: number; modified: number; deleted: number } {
    switch (changeType) {
      case 'add':
      case 'addDir':
        return { created: 1, modified: 0, deleted: 0 };
      case 'change':
        return { created: 0, modified: 1, deleted: 0 };
      case 'unlink':
      case 'unlinkDir':
        return { created: 0, modified: 0, deleted: 1 };
      default:
        return { created: 0, modified: 0, deleted: 0 };
    }
  }

  static formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  static formatHour(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(11, 13);
  }

  static getDayOfWeek(timestamp: number): string {
    return new Date(timestamp).getDay().toString();
  }
}

export default FileProcessor;