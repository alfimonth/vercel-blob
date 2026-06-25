import { Check, Copy, Download, Folder } from 'lucide-react';

import type { GalleryFolder, GalleryImage } from '../types';
import { formatBytes, getImageUrl } from '../libs';

type GalleryGridProps = {
  copiedImagePathname: string | null;
  folders: GalleryFolder[];
  hasMore: boolean;
  images: GalleryImage[];
  loadingImages: boolean;
  selectedFolderPathnames: Set<string>;
  selectedImagePathnames: Set<string>;
  onCopyImageUrl: (pathname: string) => void;
  onLoadMore: () => void;
  onOpenFolder: (pathname: string) => void;
  onToggleFolderSelection: (pathname: string) => void;
  onToggleImageSelection: (pathname: string) => void;
};

const GalleryGrid = ({
  copiedImagePathname,
  folders,
  hasMore,
  images,
  loadingImages,
  selectedFolderPathnames,
  selectedImagePathnames,
  onCopyImageUrl,
  onLoadMore,
  onOpenFolder,
  onToggleFolderSelection,
  onToggleImageSelection,
}: GalleryGridProps) => (
  <>
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
          <article
            key={folder.pathname}
            style={{
              overflow: 'hidden',
              minHeight: 170,
              borderRadius: 16,
              background: '#111827',
              border: selectedFolderPathnames.has(folder.pathname)
                ? '1px solid #38bdf8'
                : '1px solid #334155',
              color: '#f8fafc',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1 / 1',
                background: '#020617',
                color: '#facc15',
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
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${folder.pathname}`}
                  checked={selectedFolderPathnames.has(folder.pathname)}
                  onChange={() => onToggleFolderSelection(folder.pathname)}
                />
              </label>

              <button
                onClick={() => onOpenFolder(folder.pathname)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <Folder size={52} strokeWidth={1.8} />
              </button>
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

              <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                Folder
              </div>
            </div>
          </article>
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
            <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#020617' }}>
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
                  onChange={() => onToggleImageSelection(image.pathname)}
                />
              </label>

              <a
                href={image.previewUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', width: '100%', height: '100%' }}
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

              <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                {formatBytes(image.size)}
              </div>

              <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                {new Date(image.uploadedAt).toLocaleString()}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <a
                  href={getImageUrl(image.pathname, { download: true })}
                  download={image.pathname.split('/').at(-1)}
                  className="image-action-button image-tooltip"
                  aria-label="Download image"
                >
                  <Download size={18} strokeWidth={2.2} />
                  <span className="image-tooltip-label">Download</span>
                </a>

                <button
                  onClick={() => onCopyImageUrl(image.pathname)}
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
                    {copiedImagePathname === image.pathname ? 'Copied' : 'Copy URL'}
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
          onClick={onLoadMore}
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
  </>
);

export default GalleryGrid;
