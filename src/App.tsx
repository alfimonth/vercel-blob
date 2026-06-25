import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Folder,
  FolderPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

type CompressionStats = {
  originalSize: number;
  uploadSize: number;
  compressed: boolean;
  outputType: string;
};

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;
const ROOT_PREFIX = '';
const COMPRESSIBLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function replaceFileExtension(fileName: string, extension: string) {
  return `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
}

function getImageUrl(pathname: string, options?: { download?: boolean }) {
  const params = new URLSearchParams();
  params.set('pathname', pathname);

  if (options?.download) {
    params.set('download', '1');
  }

  return `/api/file?${params.toString()}`;
}

function getAbsoluteImageUrl(pathname: string) {
  return new URL(getImageUrl(pathname), window.location.origin).toString();
}

function getParentPrefix(prefix: string) {
  const parts = prefix.replace(/\/$/, '').split('/');

  if (!prefix || parts.length <= 1) {
    return ROOT_PREFIX;
  }

  return `${parts.slice(0, -1).join('/')}/`;
}

function formatDirectory(prefix: string) {
  if (!prefix) return 'root';

  return `root/${prefix.replace(/\/$/, '')}`;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read selected image'));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('Failed to compress image'));
      },
      type,
      quality,
    );
  });
}

async function compressImageFile(file: File) {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) {
    return { file, compressed: false };
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Browser does not support image compression');
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = 'image/webp';
  const compressedBlob = await canvasToBlob(
    canvas,
    outputType,
    IMAGE_QUALITY,
  );

  if (compressedBlob.size >= file.size) {
    return { file, compressed: false };
  }

  return {
    file: new File(
      [compressedBlob],
      replaceFileExtension(file.name, 'webp'),
      {
        type: outputType,
        lastModified: Date.now(),
      },
    ),
    compressed: true,
  };
}

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [blob, setBlob] = useState<UploadedBlob | null>(null);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);

  const [activePrefix, setActivePrefix] = useState(ROOT_PREFIX);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImagePathnames, setSelectedImagePathnames] = useState<
    Set<string>
  >(new Set());
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingImages, setDeletingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedImagePathname, setCopiedImagePathname] = useState<string | null>(
    null,
  );

  const selectedCount = selectedImagePathnames.size;
  const isRootDirectory = activePrefix === ROOT_PREFIX;
  const allVisibleImagesSelected =
    images.length > 0 &&
    images.every((image) => selectedImagePathnames.has(image.pathname));

  const selectedFilePreviews = useMemo(
    () =>
      files
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          file,
          url: URL.createObjectURL(file),
        })),
    [files],
  );

  const selectedFilesSize = files.reduce(
    (totalSize, file) => totalSize + file.size,
    0,
  );

  async function loadImages(options?: { reset?: boolean; prefix?: string }) {
    setLoadingImages(true);
    setErrorMessage(null);

    try {
      const prefix = options?.prefix ?? activePrefix;
      const params = new URLSearchParams();
      params.set('prefix', prefix);

      if (!options?.reset && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/list?${params.toString()}`);
      const result = (await response.json()) as ListResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load images');
      }

      setFolders(options?.reset ? result.folders : folders);
      setImages((current) =>
        options?.reset ? result.images : [...current, ...result.images],
      );
      if (options?.reset) {
        setSelectedImagePathnames(new Set());
      }
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load images',
      );
    } finally {
      setLoadingImages(false);
    }
  }

  function openFolder(pathname: string) {
    setActivePrefix(pathname);
    setCursor(undefined);
    void loadImages({ reset: true, prefix: pathname });
  }

  function goBackDirectory() {
    const parentPrefix = getParentPrefix(activePrefix);
    setActivePrefix(parentPrefix);
    setCursor(undefined);
    void loadImages({ reset: true, prefix: parentPrefix });
  }

  async function handleCreateFolder() {
    const folderName = window.prompt('New folder name');

    if (!folderName) return;

    setCreatingFolder(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parentPrefix: activePrefix,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create folder');
      }

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create folder',
      );
    } finally {
      setCreatingFolder(false);
    }
  }

  function toggleImageSelection(pathname: string) {
    setSelectedImagePathnames((current) => {
      const next = new Set(current);

      if (next.has(pathname)) {
        next.delete(pathname);
      } else {
        next.add(pathname);
      }

      return next;
    });
  }

  function toggleAllVisibleImages() {
    setSelectedImagePathnames((current) => {
      if (allVisibleImagesSelected) {
        return new Set(
          [...current].filter(
            (pathname) =>
              !images.some((image) => image.pathname === pathname),
          ),
        );
      }

      return new Set([
        ...current,
        ...images.map((image) => image.pathname),
      ]);
    });
  }

  async function copyImageUrl(pathname: string) {
    try {
      await navigator.clipboard.writeText(getAbsoluteImageUrl(pathname));
      setCopiedImagePathname(pathname);
      window.setTimeout(() => {
        setCopiedImagePathname((current) =>
          current === pathname ? null : current,
        );
      }, 1600);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to copy URL',
      );
    }
  }

  async function handleDeleteSelected() {
    if (selectedImagePathnames.size === 0) return;

    const selectedPathnames = [...selectedImagePathnames];
    const confirmed = window.confirm(
      `Delete ${selectedPathnames.length} selected image${
        selectedPathnames.length === 1 ? '' : 's'
      }?`,
    );

    if (!confirmed) return;

    setDeletingImages(true);
    setErrorMessage(null);
    setBlob(null);

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pathnames: selectedPathnames }),
      });

      const result = (await response.json()) as DeleteResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      setImages((current) =>
        current.filter(
          (image) => !selectedImagePathnames.has(image.pathname),
        ),
      );
      setSelectedImagePathnames(new Set());

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Delete failed',
      );
    } finally {
      setDeletingImages(false);
    }
  }

  async function uploadImage(file: File) {
    const compressionResult = await compressImageFile(file);
    const uploadFile = compressionResult.file;

    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(
        uploadFile.name,
      )}&prefix=${encodeURIComponent(activePrefix)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': uploadFile.type || 'application/octet-stream',
        },
        body: uploadFile,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Upload failed: ${file.name}`);
    }

    return {
      blob: result as UploadedBlob,
      compressed: compressionResult.compressed,
      originalSize: file.size,
      uploadSize: uploadFile.size,
      outputType: uploadFile.type || file.type || 'application/octet-stream',
    };
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    setBlob(null);
    setCompressionStats(null);

    try {
      const uploadResults = [];

      for (const selectedFile of files) {
        uploadResults.push(await uploadImage(selectedFile));
      }

      setCompressionStats({
        originalSize: uploadResults.reduce(
          (totalSize, result) => totalSize + result.originalSize,
          0,
        ),
        uploadSize: uploadResults.reduce(
          (totalSize, result) => totalSize + result.uploadSize,
          0,
        ),
        compressed: uploadResults.some((result) => result.compressed),
        outputType:
          uploadResults.length === 1
            ? uploadResults[0].outputType
            : `${uploadResults.length} files`,
      });

      setBlob(uploadResults.at(-1)?.blob ?? null);
      setFiles([]);

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    loadImages({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [selectedFilePreviews]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 40,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: '#0f172a',
        color: '#f8fafc',
      }}
    >
      <section
        style={{
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: '#111827',
            border: '1px solid #334155',
          }}
        >
          <h1 style={{ marginTop: 0 }}>Vercel Blob Image Gallery</h1>

          <p style={{ color: '#cbd5e1' }}>
            Upload gambar ke private Blob pada folder yang sedang dibuka.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: '#1f2937',
              color: '#d1d5db',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                minWidth: 0,
              }}
            >
              <Folder size={18} color="#facc15" />

              <div
                title={formatDirectory(activePrefix)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#020617',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
              >
                {formatDirectory(activePrefix)}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              <button
                onClick={goBackDirectory}
                disabled={isRootDirectory || loadingImages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  cursor:
                    isRootDirectory || loadingImages
                      ? 'not-allowed'
                      : 'pointer',
                  background:
                    isRootDirectory || loadingImages ? '#334155' : '#020617',
                  color: '#f8fafc',
                  fontWeight: 700,
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 0,
                  cursor: creatingFolder ? 'not-allowed' : 'pointer',
                  background: creatingFolder ? '#475569' : '#22c55e',
                  color: '#052e16',
                  fontWeight: 700,
                }}
              >
                <FolderPlus size={16} />
                {creatingFolder ? 'Creating...' : 'New Folder'}
              </button>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: '#020617',
                  color: '#f8fafc',
                  fontWeight: 700,
                }}
              >
                Choose File
                <input
                  type="file"
                  multiple
                  disabled={uploading}
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    setFiles(Array.from(event.target.files ?? []));
                    setBlob(null);
                    setCompressionStats(null);
                    setErrorMessage(null);
                  }}
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 0,
                  cursor:
                    files.length === 0 || uploading
                      ? 'not-allowed'
                      : 'pointer',
                  background:
                    files.length === 0 || uploading ? '#475569' : '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 700,
                }}
              >
                {uploading
                  ? 'Compressing & uploading...'
                  : `Upload Image${files.length > 1 ? 's' : ''}`}
              </button>

              <button
                onClick={() => loadImages({ reset: true })}
                disabled={loadingImages}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  cursor: loadingImages ? 'not-allowed' : 'pointer',
                  background: '#020617',
                  color: '#f8fafc',
                  fontWeight: 700,
                }}
              >
                {loadingImages ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {files.length > 0 && (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                padding: 12,
                borderRadius: 12,
                background: '#1f2937',
                color: '#d1d5db',
              }}
            >
              {selectedFilePreviews.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 72px)',
                    gap: 8,
                  }}
                >
                  {selectedFilePreviews.slice(0, 4).map((preview, index) => (
                    <img
                      key={`${preview.file.name}-${preview.file.lastModified}`}
                      src={preview.url}
                      alt={`Selected preview ${index + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid #334155',
                      }}
                    />
                  ))}
                </div>
              )}

              <div>
                <div>
                  <strong>Selected:</strong> {files.length} file
                  {files.length === 1 ? '' : 's'}
                </div>
                <div>
                  <strong>Total size:</strong> {formatBytes(selectedFilesSize)}
                </div>
                <ul
                  style={{
                    margin: '8px 0 0',
                    paddingLeft: 18,
                    color: '#cbd5e1',
                  }}
                >
                  {files.slice(0, 5).map((selectedFile) => (
                    <li key={`${selectedFile.name}-${selectedFile.lastModified}`}>
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </li>
                  ))}
                  {files.length > 5 && (
                    <li>{files.length - 5} more file(s)</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {errorMessage && (
            <p style={{ marginTop: 16, color: '#fca5a5' }}>
              {errorMessage}
            </p>
          )}

          {blob && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 12,
                background: '#052e16',
                border: '1px solid #166534',
                color: '#bbf7d0',
              }}
            >
              Upload berhasil. Last file: <code>{blob.pathname}</code>
            </div>
          )}

          {compressionStats && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: '#082f49',
                border: '1px solid #075985',
                color: '#bae6fd',
              }}
            >
              {compressionStats.compressed ? 'Compressed' : 'Uploaded original'}:{' '}
              {formatBytes(compressionStats.originalSize)} →{' '}
              {formatBytes(compressionStats.uploadSize)}
              <span style={{ color: '#7dd3fc' }}>
                {' '}
                ({compressionStats.outputType})
              </span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0 }}>Uploaded Images</h2>

            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#cbd5e1' }}>
                {folders.length} folder{folders.length === 1 ? '' : 's'} ·{' '}
                {images.length} image{images.length === 1 ? '' : 's'}
              </span>

              {images.length > 0 && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#cbd5e1',
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allVisibleImagesSelected}
                    onChange={toggleAllVisibleImages}
                  />
                  Select all
                </label>
              )}

              {selectedCount > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deletingImages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 0,
                    cursor: deletingImages ? 'not-allowed' : 'pointer',
                    background: deletingImages ? '#475569' : '#ef4444',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {deletingImages
                    ? 'Deleting...'
                    : `Delete checked (${selectedCount})`}
                </button>
              )}
            </div>
          </div>

          {loadingImages && folders.length === 0 && images.length === 0 ? (
            <p style={{ color: '#cbd5e1' }}>Loading images...</p>
          ) : folders.length === 0 && images.length === 0 ? (
            <div
              style={{
                marginTop: 16,
                padding: 24,
                borderRadius: 16,
                background: '#111827',
                border: '1px dashed #475569',
                color: '#cbd5e1',
                textAlign: 'center',
              }}
            >
              Folder ini masih kosong.
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {folders.map((folder) => (
                <button
                  key={folder.pathname}
                  onClick={() => openFolder(folder.pathname)}
                  style={{
                    overflow: 'hidden',
                    minHeight: 170,
                    borderRadius: 16,
                    background: '#111827',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '1 / 1',
                      background: '#020617',
                      color: '#facc15',
                    }}
                  >
                    <Folder size={52} strokeWidth={1.8} />
                  </div>

                  <div style={{ padding: 12 }}>
                    <div
                      title={folder.pathname}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {folder.name}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      Folder
                    </div>
                  </div>
                </button>
              ))}

              {images.map((image) => (
                <article
                  key={image.pathname}
                  style={{
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: '#111827',
                    border: selectedImagePathnames.has(image.pathname)
                      ? '1px solid #38bdf8'
                      : '1px solid #334155',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      background: '#020617',
                    }}
                  >
                    <label
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'rgba(2, 6, 23, 0.82)',
                        border: '1px solid #475569',
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${image.pathname}`}
                        checked={selectedImagePathnames.has(image.pathname)}
                        onChange={() => toggleImageSelection(image.pathname)}
                      />
                    </label>

                    <a
                      href={image.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <img
                        src={image.previewUrl}
                        alt={image.pathname}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </a>
                  </div>

                  <div style={{ padding: 12 }}>
                    <div
                      title={image.pathname}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {image.pathname.split('/').at(-1)}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      {formatBytes(image.size)}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      {new Date(image.uploadedAt).toLocaleString()}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <a
                        href={getImageUrl(image.pathname, {
                          download: true,
                        })}
                        download={image.pathname.split('/').at(-1)}
                        className="image-action-button image-tooltip"
                        aria-label="Download image"
                      >
                        <Download size={18} strokeWidth={2.2} />
                        <span className="image-tooltip-label">Download</span>
                      </a>

                      <button
                        onClick={() => copyImageUrl(image.pathname)}
                        className={`image-action-button image-tooltip${
                          copiedImagePathname === image.pathname
                            ? ' image-action-button-copied'
                            : ''
                        }`}
                        aria-label="Copy image URL"
                      >
                        {copiedImagePathname === image.pathname ? (
                          <Check size={18} strokeWidth={2.4} />
                        ) : (
                          <Copy size={18} strokeWidth={2.2} />
                        )}
                        <span className="image-tooltip-label">
                          {copiedImagePathname === image.pathname
                            ? 'Copied'
                            : 'Copy URL'}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={() => loadImages()}
                disabled={loadingImages}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #475569',
                  cursor: loadingImages ? 'not-allowed' : 'pointer',
                  background: '#020617',
                  color: '#f8fafc',
                  fontWeight: 700,
                }}
              >
                {loadingImages ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
