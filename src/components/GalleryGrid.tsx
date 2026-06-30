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
      <p className="text-slate-300">Loading images...</p>
    ) : folders.length === 0 && images.length === 0 ? (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-600 bg-slate-900 p-6 text-center text-slate-300">
        Folder ini masih kosong.
      </div>
    ) : (
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {folders.map((folder) => (
          <article
            key={folder.pathname}
            className={`min-h-[170px] overflow-hidden rounded-2xl border bg-slate-900 text-left text-slate-50 ${
              selectedFolderPathnames.has(folder.pathname)
                ? 'border-sky-400'
                : 'border-slate-700'
            }`}
          >
            <div className="relative flex aspect-square items-center justify-center bg-slate-950 text-yellow-400">
              <label
                className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-600 bg-slate-950/80"
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
                className="flex h-full w-full cursor-pointer items-center justify-center border-0 bg-transparent text-inherit"
              >
                <Folder size={52} strokeWidth={1.8} />
              </button>
            </div>

            <div className="p-3">
              <div
                title={folder.pathname}
                className="overflow-hidden truncate text-[13px] font-bold"
              >
                {folder.name}
              </div>

              <div className="mt-1.5 text-xs text-slate-400">
                Folder
              </div>
            </div>
          </article>
        ))}

        {images.map((image) => (
          <article
            key={image.pathname}
            className={`overflow-hidden rounded-2xl border bg-slate-900 ${
              selectedImagePathnames.has(image.pathname)
                ? 'border-sky-400'
                : 'border-slate-700'
            }`}
          >
            <div className="relative aspect-square bg-slate-950">
              <label
                className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-600 bg-slate-950/80"
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
                className="block h-full w-full"
              >
                <img
                  src={image.previewUrl}
                  alt={image.pathname}
                  loading="lazy"
                  className="block h-full w-full object-cover"
                />
              </a>
            </div>

            <div className="p-3">
              <div
                title={image.pathname}
                className="overflow-hidden truncate text-[13px] font-bold"
              >
                {image.pathname.split('/').at(-1)}
              </div>

              <div className="mt-1.5 text-xs text-slate-400">
                {formatBytes(image.size)}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {new Date(image.uploadedAt).toLocaleString()}
              </div>

              <div className="mt-2.5 flex gap-2">
                <a
                  href={getImageUrl(image.pathname, { download: true })}
                  download={image.pathname.split('/').at(-1)}
                  className="group relative inline-flex h-[38px] min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-600 bg-slate-950 text-slate-50 no-underline hover:border-sky-400 hover:text-sky-200 focus-visible:border-sky-400 focus-visible:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  aria-label="Download image"
                >
                  <Download size={18} strokeWidth={2.2} />
                  <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-[140px] -translate-x-1/2 translate-y-1 rounded-md border border-slate-600 bg-slate-950 px-2 py-[5px] text-xs font-bold leading-tight text-slate-50 opacity-0 transition after:absolute after:left-1/2 after:top-full after:h-2 after:w-2 after:-translate-x-1/2 after:-translate-y-1 after:rotate-45 after:border-b after:border-r after:border-slate-600 after:bg-slate-950 after:content-[''] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    Download
                  </span>
                </a>

                <button
                  onClick={() => onCopyImageUrl(image.pathname)}
                  className={`group relative inline-flex h-[38px] min-w-0 flex-1 items-center justify-center rounded-lg border text-slate-50 hover:border-sky-400 hover:text-sky-200 focus-visible:border-sky-400 focus-visible:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    copiedImagePathname === image.pathname
                      ? 'border-emerald-500 bg-emerald-950 text-emerald-100'
                      : 'border-slate-600 bg-slate-950'
                  }`}
                  aria-label="Copy image URL"
                >
                  {copiedImagePathname === image.pathname ? (
                    <Check size={18} strokeWidth={2.4} />
                  ) : (
                    <Copy size={18} strokeWidth={2.2} />
                  )}
                  <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-[140px] -translate-x-1/2 translate-y-1 rounded-md border border-slate-600 bg-slate-950 px-2 py-[5px] text-xs font-bold leading-tight text-slate-50 opacity-0 transition after:absolute after:left-1/2 after:top-full after:h-2 after:w-2 after:-translate-x-1/2 after:-translate-y-1 after:rotate-45 after:border-b after:border-r after:border-slate-600 after:bg-slate-950 after:content-[''] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
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
      <div className="mt-6 text-center">
        <button
          onClick={onLoadMore}
          disabled={loadingImages}
          className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-2.5 font-bold text-slate-50 disabled:cursor-not-allowed enabled:cursor-pointer"
        >
          {loadingImages ? 'Loading...' : 'Load More'}
        </button>
      </div>
    )}
  </>
);

export default GalleryGrid;
