import mongoose, { Schema, Document } from 'mongoose';
import { ProcessedFileData } from '../types';

export interface IProcessedFileDocument extends ProcessedFileData, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ProcessedFileSchema: Schema = new Schema(
  {
    filePath: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      index: true,
    },
    fileExtension: {
      type: String,
      required: true,
      index: true,
    },
    directory: {
      type: String,
      required: true,
      index: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['document', 'image', 'video', 'audio', 'code', 'archive', 'other'],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['document', 'media', 'code', 'archive', 'other'],
      index: true,
    },
    changeType: {
      type: String,
      required: true,
      enum: ['add', 'change', 'unlink', 'addDir', 'unlinkDir'],
      index: true,
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    isDirectory: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    clientMacAddress: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'processed_files',
  }
);

// Compound indexes for efficient queries
ProcessedFileSchema.index({ timestamp: -1, changeType: 1 });
ProcessedFileSchema.index({ category: 1, timestamp: -1 });
ProcessedFileSchema.index({ fileType: 1, timestamp: -1 });
ProcessedFileSchema.index({ directory: 1, timestamp: -1 });
ProcessedFileSchema.index({ fileExtension: 1, timestamp: -1 });
ProcessedFileSchema.index({ isDirectory: 1, timestamp: -1 });
ProcessedFileSchema.index({ clientMacAddress: 1, timestamp: -1 });
ProcessedFileSchema.index({ clientMacAddress: 1, changeType: 1, timestamp: -1 });

export default mongoose.model<IProcessedFileDocument>(
  'ProcessedFile',
  ProcessedFileSchema
);