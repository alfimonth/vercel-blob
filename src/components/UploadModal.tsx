import { Upload, X } from 'lucide-react';
import type { DragEvent } from 'react';

import { formatDirectory, formatBytes } from '../libs';

type SelectedFilePreview = {
  file: File;
  url: string;
};

type UploadModalProps = {
  activePrefix: string;
  draggingFiles: boolean;
  files: File[];
  selectedFilePreviews: SelectedFilePreview[];
  selectedFilesSize: number;
  uploading: boolean;
  onClose: () => void;
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onSelectedFiles: (fileList: FileList | File[]) => void;
  onUpload: () => void;
};

const UploadModal = ({
  activePrefix,
  draggingFiles,
  files,
  selectedFilePreviews,
  selectedFilesSize,
  uploading,
  onClose,
  onDragLeave,
  onDragOver,
  onDrop,
  onSelectedFiles,
  onUpload,
}: UploadModalProps) => (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur">
    <div className="max-h-[min(760px,calc(100vh-40px))] w-[min(640px,100%)] overflow-auto rounded-2xl border border-slate-700 bg-slate-900 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-700 px-5 py-[18px]">
        <div>
          <h2 className="m-0 text-xl text-slate-50">
            Upload images
          </h2>
          <div
            title={formatDirectory(activePrefix)}
            className="mt-1 overflow-hidden truncate font-mono text-[13px] text-slate-400"
          >
            {formatDirectory(activePrefix)}
          </div>
        </div>

        <button
          onClick={onClose}
          disabled={uploading}
          aria-label="Close upload modal"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-950 text-slate-50 disabled:cursor-not-allowed enabled:cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5">
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex min-h-[220px] flex-col items-center justify-center rounded-[14px] p-6 text-center text-slate-200 ${
            draggingFiles
              ? 'border border-sky-400 bg-sky-950'
              : 'border border-dashed border-slate-600 bg-slate-900'
          } ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[14px] border border-slate-700 bg-slate-950 text-sky-400">
            <Upload size={26} />
          </div>

          <div className="mt-3.5 text-lg font-bold text-slate-50">
            Drop images here
          </div>

          <div className="mt-1.5 text-sm text-slate-400">
            JPEG, PNG, WebP, GIF, AVIF, or SVG
          </div>

          <span className="mt-4 rounded-lg bg-sky-400 px-3 py-[9px] font-bold text-slate-900">
            Choose files
          </span>

          <input
            type="file"
            multiple
            disabled={uploading}
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            className="hidden"
            onChange={(event) => {
              onSelectedFiles(event.target.files ?? []);
            }}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-4 flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-300">
            {selectedFilePreviews.length > 0 && (
              <div className="grid grid-cols-[repeat(2,72px)] gap-2">
                {selectedFilePreviews.slice(0, 4).map((preview, index) => (
                  <img
                    key={`${preview.file.name}-${preview.file.lastModified}`}
                    src={preview.url}
                    alt={`Selected preview ${index + 1}`}
                    className="h-[72px] w-[72px] rounded-[10px] border border-slate-700 object-cover"
                  />
                ))}
              </div>
            )}

            <div className="min-w-0">
              <div>
                <strong>Selected:</strong> {files.length} file
                {files.length === 1 ? '' : 's'}
              </div>
              <div>
                <strong>Total size:</strong> {formatBytes(selectedFilesSize)}
              </div>
              <ul className="mt-2 list-disc pl-[18px] text-slate-300">
                {files.slice(0, 5).map((selectedFile) => (
                  <li key={`${selectedFile.name}-${selectedFile.lastModified}`}>
                    {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </li>
                ))}
                {files.length > 5 && <li>{files.length - 5} more file(s)</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-[18px] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3.5 py-2.5 font-bold text-slate-50 disabled:cursor-not-allowed enabled:cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onUpload}
            disabled={files.length === 0 || uploading}
            className="rounded-lg border-0 px-3.5 py-2.5 font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-600 enabled:cursor-pointer enabled:bg-sky-400"
          >
            {uploading
              ? 'Compressing & uploading...'
              : `Upload Image${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default UploadModal;
