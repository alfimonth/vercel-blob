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
    {errorMessage && <p className="mt-4 text-red-300">{errorMessage}</p>}

    {blob && (
      <div className="mt-5 rounded-xl border border-green-800 bg-green-950 p-3 text-green-200">
        Upload berhasil. Last file: <code>{blob.pathname}</code>
      </div>
    )}

    {compressionStats && (
      <div className="mt-3 rounded-xl border border-sky-800 bg-sky-950 p-3 text-sky-200">
        {compressionStats.compressed ? 'Compressed' : 'Uploaded original'}:{' '}
        {formatBytes(compressionStats.originalSize)} {'->'}{' '}
        {formatBytes(compressionStats.uploadSize)}
        <span className="text-sky-300"> ({compressionStats.outputType})</span>
      </div>
    )}
  </>
);

export default UploadStatus;
