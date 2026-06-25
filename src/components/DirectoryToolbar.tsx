import { ArrowLeft, RefreshCcw, RefreshCw } from 'lucide-react';

import { formatDirectory } from '../libs';

type DirectoryToolbarProps = {
  activePrefix: string;
  isRootDirectory: boolean;
  loadingImages: boolean;
  onBack: () => void;
  onRefresh: () => void;
};

const DirectoryToolbar = ({
  activePrefix,
  isRootDirectory,
  loadingImages,
  onBack,
  onRefresh,
}: DirectoryToolbarProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      minWidth: 0,
    }}
  >
    <button
      onClick={onBack}
      disabled={isRootDirectory || loadingImages}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px',
        borderRadius: 8,
        border: '1px solid #475569',
        cursor: isRootDirectory || loadingImages ? 'not-allowed' : 'pointer',
        background: isRootDirectory || loadingImages ? '#334155' : '#020617',
        color: '#f8fafc',
        fontWeight: 700,
      }}
    >
      <ArrowLeft size={16} />
    </button>

    <div
      title={formatDirectory(activePrefix)}
      style={{
        flex: 1,
        minWidth: 0,
        padding: '9px 10px',
        lineHeight: '16px',
        borderRadius: 8,
        background: '#020617',
        border: '1px solid #334155',
        color: '#e2e8f0',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 13,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left',
      }}
    >
      {formatDirectory(activePrefix)}
    </div>

    <button
      onClick={onRefresh}
      disabled={loadingImages}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px',
        borderRadius: 8,
        border: '1px solid #475569',
        cursor: loadingImages ? 'not-allowed' : 'pointer',
        background: '#020617',
        color: '#f8fafc',
      }}
    >
      {loadingImages ? (
        <RefreshCcw style={{ animation: 'spin 1s linear infinite' }} size={16} />
      ) : (
        <RefreshCw size={16} />
      )}
    </button>
  </div>
);

export default DirectoryToolbar;
