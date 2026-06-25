import type { CompressionStats, UploadedBlob } from '../types';
import { formatBytes } from '../libs';

type UploadStatusProps = {
  blob: UploadedBlob | null;
  compressionStats: CompressionStats | null;
  errorMessage: string | null;
};

const UploadStatus = ({
  blob,
  compressionStats,
  errorMessage,
}: UploadStatusProps) => (
  <>
    {errorMessage && <p style={{ marginTop: 16, color: '#fca5a5' }}>{errorMessage}</p>}

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
        {formatBytes(compressionStats.originalSize)} {'->'}{' '}
        {formatBytes(compressionStats.uploadSize)}
        <span style={{ color: '#7dd3fc' }}> ({compressionStats.outputType})</span>
      </div>
    )}
  </>
);

export default UploadStatus;
