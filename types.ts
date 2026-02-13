
export enum FileCategory {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  CODE = 'CODE',
  ARCHIVE = 'ARCHIVE',
  UNKNOWN = 'UNKNOWN'
}

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  category: FileCategory;
  blob: Blob;
  path: string;
}

export interface FileInsight {
  summary: string;
  suggestedAction: string;
  detectedType: string;
}
