import { ClipboardPaste, FolderInput, FolderPlus, X, Upload } from 'lucide-react';

type GalleryToolbarProps = {
  allVisibleItemsSelected: boolean;
  creatingFolder: boolean;
  deletingImages: boolean;
  folderCount: number;
  imageCount: number;
  moveItemCount: number;
  movingItems: boolean;
  selectedCount: number;
  uploading: boolean;
  visibleItemCount: number;
  onCreateFolder: () => void;
  onCancelMove: () => void;
  onDeleteSelected: () => void;
  onMoveSelected: () => void;
  onOpenUpload: () => void;
  onPasteMoved: () => void;
  onToggleAllVisible: () => void;
};

const GalleryToolbar = ({
  allVisibleItemsSelected,
  creatingFolder,
  deletingImages,
  folderCount,
  imageCount,
  moveItemCount,
  movingItems,
  selectedCount,
  uploading,
  visibleItemCount,
  onCreateFolder,
  onCancelMove,
  onDeleteSelected,
  onMoveSelected,
  onOpenUpload,
  onPasteMoved,
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

      {(selectedCount > 0 || moveItemCount > 0) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {moveItemCount > 0 ? (
            <>
              <button
                onClick={onPasteMoved}
                disabled={movingItems || deletingImages}
                className="inline-flex items-center gap-2 rounded-lg border-0 px-3 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-amber-400"
              >
                <ClipboardPaste size={16} />
                {movingItems ? 'Moving...' : `Paste (${moveItemCount})`}
              </button>

              <button
                onClick={onCancelMove}
                disabled={movingItems}
                aria-label="Cancel move"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-50 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={onMoveSelected}
              disabled={movingItems || deletingImages}
              className="inline-flex items-center gap-2 rounded-lg border-0 px-3 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-amber-400"
            >
              <FolderInput size={16} />
              {`Move (${selectedCount})`}
            </button>
          )}

          {selectedCount > 0 && (
            <button
              onClick={onDeleteSelected}
              disabled={deletingImages || movingItems}
              className="rounded-lg border-0 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-red-500"
            >
              {deletingImages ? 'Deleting...' : `Delete (${selectedCount})`}
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default GalleryToolbar;
