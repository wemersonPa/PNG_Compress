export type OutputFormat = 'png';

export interface Settings {
  targetSize: number; // in KB
}

export interface ImageInfo {
  url: string;
  size: number;
  name: string;
  blob: Blob;
}

export enum ProcessStatus {
  QUEUED = 'Queued',
  COMPRESSING = 'Compressing...',
  SUCCESS = 'OK',
  ERROR = 'Error',
}

export interface ProcessedImage {
  id: string;
  file: File;
  status: ProcessStatus;
  originalImage: ImageInfo;
  compressedImage: ImageInfo | null;
  error?: string;
}
