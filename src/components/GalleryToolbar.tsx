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
  <div className="mt-8">
    <div className="flex justify-between gap-4">
      <span className="text-slate-300">
        {folderCount} folder{folderCount === 1 ? '' : 's'} · {imageCount} image
        {imageCount === 1 ? '' : 's'}
      </span>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onCreateFolder}
          disabled={creatingFolder}
          className="inline-flex items-center gap-2 rounded-lg border-0 px-3 py-[9px] font-bold text-green-950 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-green-500"
        >
          <FolderPlus size={16} />
          {creatingFolder ? 'Creating...' : 'New Folder'}
        </button>

        <button
          onClick={onOpenUpload}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border-0 px-3 py-[9px] font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-sky-400"
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {visibleItemCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
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
          className="rounded-lg border-0 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-red-500"
        >
          {deletingImages ? 'Deleting...' : `Delete checked (${selectedCount})`}
        </button>
      )}
    </div>
  </div>
);

export default GalleryToolbar;
