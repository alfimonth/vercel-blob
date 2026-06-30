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
  <div className="flex w-full min-w-0 items-center gap-2.5">
    <button
      onClick={onBack}
      disabled={isRootDirectory || loadingImages}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 p-[9px] font-bold text-slate-50 disabled:cursor-not-allowed disabled:bg-slate-700 enabled:cursor-pointer enabled:bg-slate-950"
    >
      <ArrowLeft size={16} />
    </button>

    <div
      title={formatDirectory(activePrefix)}
      className="min-w-0 flex-1 overflow-hidden truncate rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-[9px] text-left font-mono text-[13px] leading-4 text-slate-200"
    >
      {formatDirectory(activePrefix)}
    </div>

    <button
      onClick={onRefresh}
      disabled={loadingImages}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950 p-[9px] text-slate-50 disabled:cursor-not-allowed enabled:cursor-pointer"
    >
      {loadingImages ? (
        <RefreshCcw className="animate-spin" size={16} />
      ) : (
        <RefreshCw size={16} />
      )}
    </button>
  </div>
);

export default DirectoryToolbar;
