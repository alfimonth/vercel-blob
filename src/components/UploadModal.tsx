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
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'rgba(2, 6, 23, 0.72)',
      backdropFilter: 'blur(8px)',
    }}
  >
    <div
      style={{
        width: 'min(640px, 100%)',
        maxHeight: 'min(760px, calc(100vh - 40px))',
        overflow: 'auto',
        borderRadius: 16,
        background: '#0f172a',
        border: '1px solid #334155',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '18px 20px',
          borderBottom: '1px solid #334155',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 20 }}>
            Upload images
          </h2>
          <div
            title={formatDirectory(activePrefix)}
            style={{
              marginTop: 4,
              color: '#94a3b8',
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDirectory(activePrefix)}
          </div>
        </div>

        <button
          onClick={onClose}
          disabled={uploading}
          aria-label="Close upload modal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #475569',
            background: '#020617',
            color: '#f8fafc',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 220,
            padding: 24,
            borderRadius: 14,
            border: draggingFiles ? '1px solid #38bdf8' : '1px dashed #475569',
            background: draggingFiles ? '#082f49' : '#111827',
            color: '#e2e8f0',
            cursor: uploading ? 'not-allowed' : 'pointer',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 54,
              height: 54,
              borderRadius: 14,
              background: '#020617',
              border: '1px solid #334155',
              color: '#38bdf8',
            }}
          >
            <Upload size={26} />
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 18,
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            Drop images here
          </div>

          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>
            JPEG, PNG, WebP, GIF, AVIF, or SVG
          </div>

          <span
            style={{
              marginTop: 16,
              padding: '9px 12px',
              borderRadius: 8,
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
            }}
          >
            Choose files
          </span>

          <input
            type="file"
            multiple
            disabled={uploading}
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(event) => {
              onSelectedFiles(event.target.files ?? []);
            }}
          />
        </label>

        {files.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              padding: 12,
              borderRadius: 12,
              background: '#111827',
              border: '1px solid #334155',
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

            <div style={{ minWidth: 0 }}>
              <div>
                <strong>Selected:</strong> {files.length} file
                {files.length === 1 ? '' : 's'}
              </div>
              <div>
                <strong>Total size:</strong> {formatBytes(selectedFilesSize)}
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#cbd5e1' }}>
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 18,
          }}
        >
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #475569',
              background: '#020617',
              color: '#f8fafc',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            Cancel
          </button>

          <button
            onClick={onUpload}
            disabled={files.length === 0 || uploading}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: 0,
              background: files.length === 0 || uploading ? '#475569' : '#38bdf8',
              color: '#0f172a',
              cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
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
