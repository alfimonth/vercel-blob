import { FolderPlus, Upload } from 'lucide-react';

type GalleryToolbarProps = {
  allVisibleItemsSelected: boolean;
  creatingFolder: boolean;
  deletingImages: boolean;
  folderCount: number;
  imageCount: number;
  selectedCount: number;
  uploading: boolean;
  visibleItemCount: number;
  onCreateFolder: () => void;
  onDeleteSelected: () => void;
  onOpenUpload: () => void;
  onToggleAllVisible: () => void;
};

const GalleryToolbar = ({
  allVisibleItemsSelected,
  creatingFolder,
  deletingImages,
  folderCount,
  imageCount,
  selectedCount,
  uploading,
  visibleItemCount,
  onCreateFolder,
  onDeleteSelected,
  onOpenUpload,
  onToggleAllVisible,
}: GalleryToolbarProps) => (
  <div style={{ marginTop: 32 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#cbd5e1' }}>
        {folderCount} folder{folderCount === 1 ? '' : 's'} · {imageCount} image
        {imageCount === 1 ? '' : 's'}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onCreateFolder}
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

        <button
          onClick={onOpenUpload}
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 12px',
            borderRadius: 8,
            border: 0,
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: uploading ? '#475569' : '#38bdf8',
            color: '#0f172a',
            fontWeight: 700,
          }}
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {visibleItemCount > 0 && (
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
              checked={allVisibleItemsSelected}
              onChange={onToggleAllVisible}
            />
            Select all
          </label>
        )}
      </div>

      {selectedCount > 0 && (
        <button
          onClick={onDeleteSelected}
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
          {deletingImages ? 'Deleting...' : `Delete checked (${selectedCount})`}
        </button>
      )}
    </div>
  </div>
);

export default GalleryToolbar;
