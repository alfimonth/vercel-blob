type UploadedBlob = {
  url: string;
  downloadUrl?: string;
  pathname: string;
  contentType?: string;
  contentDisposition?: string;
  previewUrl: string;
};

type GalleryImage = {
  url: string;
  downloadUrl?: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  previewUrl: string;
};

type GalleryFolder = {
  pathname: string;
  name: string;
};

type ListResponse = {
  folders: GalleryFolder[];
  images: GalleryImage[];
  cursor?: string;
  hasMore: boolean;
  error?: string;
};

type DeleteResponse = {
  deleted?: number;
  error?: string;
};

type MoveResponse = {
  moved?: number;
  targetPrefix: string;
  error?: string;
};

type CompressionStats = {
  originalSize: number;
  uploadSize: number;
  compressed: boolean;
  outputType: string;
};

export type {
  UploadedBlob,
  GalleryImage,
  GalleryFolder,
  ListResponse,
  DeleteResponse,
  MoveResponse,
  CompressionStats,
};
