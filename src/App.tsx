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

type ListResponse = {
  images: GalleryImage[];
  cursor?: string;
  hasMore: boolean;
  error?: string;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [blob, setBlob] = useState<UploadedBlob | null>(null);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedFilePreview = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  async function loadImages(options?: { reset?: boolean }) {
    setLoadingImages(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set('prefix', 'uploads/');

      if (!options?.reset && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/list?${params.toString()}`);
      const result = (await response.json()) as ListResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load images');
      }

      setImages((current) =>
        options?.reset ? result.images : [...current, ...result.images],
      );
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

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);
    setBlob(null);

    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setBlob(result);
      setFile(null);

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
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

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
            Upload gambar ke private Blob, lalu tampilkan semua gambar yang
            sudah masuk.
          </p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setBlob(null);
              setErrorMessage(null);
            }}
          />

          {file && (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                background: '#1f2937',
                color: '#d1d5db',
              }}
            >
              {selectedFilePreview && (
                <img
                  src={selectedFilePreview}
                  alt="Selected preview"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid #334155',
                  }}
                />
              )}

              <div>
                <div>
                  <strong>Selected:</strong> {file.name}
                </div>
                <div>
                  <strong>Type:</strong> {file.type || '-'}
                </div>
                <div>
                  <strong>Size:</strong> {formatBytes(file.size)}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 0,
                cursor: !file || uploading ? 'not-allowed' : 'pointer',
                background: !file || uploading ? '#475569' : '#38bdf8',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            <button
              onClick={() => loadImages({ reset: true })}
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
              {loadingImages ? 'Refreshing...' : 'Refresh Gallery'}
            </button>
          </div>

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
              Upload berhasil: <code>{blob.pathname}</code>
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
            }}
          >
            <h2 style={{ margin: 0 }}>Uploaded Images</h2>

            <span style={{ color: '#cbd5e1' }}>
              {images.length} image{images.length === 1 ? '' : 's'}
            </span>
          </div>

          {loadingImages && images.length === 0 ? (
            <p style={{ color: '#cbd5e1' }}>Loading images...</p>
          ) : images.length === 0 ? (
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
              Belum ada gambar di folder uploads/.
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
              {images.map((image) => (
                <article
                  key={image.pathname}
                  style={{
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: '#111827',
                    border: '1px solid #334155',
                  }}
                >
                  <a
                    href={image.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      aspectRatio: '1 / 1',
                      background: '#020617',
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
                      {image.pathname.replace('uploads/', '')}
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