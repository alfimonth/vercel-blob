import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  DirectoryToolbar,
  GalleryGrid,
  GalleryToolbar,
  Header,
  UploadModal,
  UploadStatus,
} from '../components';
import { ROOT_PREFIX } from '../config';
import {
  compressImageFile,
  getAbsoluteImageUrl,
  getParentPrefix,
} from '../libs';
import type {
  CompressionStats,
  ListResponse,
  MoveResponse,
  UploadedBlob,
} from '../types';

type UploadResult = {
  blob: UploadedBlob;
  compressed: boolean;
  originalSize: number;
  uploadSize: number;
  outputType: string;
};

type PendingMove = {
  folderPathnames: string[];
  pathnames: string[];
  sourcePrefix: string;
};

const galleryQueryKey = (prefix: string) => ['gallery', prefix] as const;

async function readApiJson<T>(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const result = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(
      isJson && result?.error
        ? result.error
        : typeof result === 'string' && result.length > 0
          ? result
          : 'Request failed',
    );
  }

  if (!isJson) {
    throw new Error('Expected JSON response from API');
  }

  return result as T;
}

async function fetchGalleryPage(prefix: string, cursor?: string) {
  const params = new URLSearchParams();
  params.set('prefix', prefix);

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`/api/list?${params.toString()}`);

  return readApiJson<ListResponse>(response);
}

async function createFolder(name: string, parentPrefix: string) {
  const response = await fetch('/api/create-folder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parentPrefix,
    }),
  });

  return readApiJson(response);
}

async function deleteItems(folderPathnames: string[], pathnames: string[]) {
  const response = await fetch('/api/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderPathnames,
      pathnames,
    }),
  });

  return readApiJson(response);
}

async function moveItems(
  folderPathnames: string[],
  pathnames: string[],
  targetPrefix: string,
) {
  const response = await fetch('/api/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderPathnames,
      pathnames,
      targetPrefix,
    }),
  });

  return readApiJson<MoveResponse>(response);
}

const RootPage = () => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [blob, setBlob] = useState<UploadedBlob | null>(null);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);

  const [activePrefix, setActivePrefix] = useState(ROOT_PREFIX);
  const [selectedFolderPathnames, setSelectedFolderPathnames] = useState<
    Set<string>
  >(new Set());
  const [selectedImagePathnames, setSelectedImagePathnames] = useState<
    Set<string>
  >(new Set());

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedImagePathname, setCopiedImagePathname] = useState<string | null>(
    null,
  );
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const galleryQuery = useInfiniteQuery({
    queryKey: galleryQueryKey(activePrefix),
    queryFn: ({ pageParam }) => fetchGalleryPage(activePrefix, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
  });

  const folders = useMemo(() => {
    const folderMap = new Map<string, ListResponse['folders'][number]>();

    galleryQuery.data?.pages.forEach((page) => {
      page.folders.forEach((folder) => {
        folderMap.set(folder.pathname, folder);
      });
    });

    return [...folderMap.values()];
  }, [galleryQuery.data]);
  const images = useMemo(
    () => galleryQuery.data?.pages.flatMap((page) => page.images) ?? [],
    [galleryQuery.data],
  );

  const loadingImages =
    galleryQuery.isLoading ||
    galleryQuery.isFetching ||
    galleryQuery.isFetchingNextPage;
  const hasMore = galleryQuery.hasNextPage;
  const queryErrorMessage =
    galleryQuery.error instanceof Error ? galleryQuery.error.message : null;

  const selectedCount =
    selectedFolderPathnames.size + selectedImagePathnames.size;
  const moveItemCount = pendingMove
    ? pendingMove.folderPathnames.length + pendingMove.pathnames.length
    : 0;
  const isRootDirectory = activePrefix === ROOT_PREFIX;
  const visibleItemCount = folders.length + images.length;
  const allVisibleItemsSelected =
    visibleItemCount > 0 &&
    folders.every((folder) => selectedFolderPathnames.has(folder.pathname)) &&
    images.every((image) => selectedImagePathnames.has(image.pathname));

  const selectedFilePreviews = useMemo(
    () =>
      files
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          file,
          url: URL.createObjectURL(file),
        })),
    [files],
  );

  const selectedFilesSize = files.reduce(
    (totalSize, file) => totalSize + file.size,
    0,
  );

  const setSelectedFiles = (fileList: FileList | File[]) => {
    setFiles(Array.from(fileList));
    setBlob(null);
    setCompressionStats(null);
    setErrorMessage(null);
  };

  const closeUploadModal = () => {
    if (uploadMutation.isPending) return;

    setUploadModalOpen(false);
    setDraggingFiles(false);
    setFiles([]);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDraggingFiles(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDraggingFiles(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDraggingFiles(false);

    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (droppedFiles.length > 0) {
      setSelectedFiles(droppedFiles);
    }
  };

  const openFolder = (pathname: string) => {
    setActivePrefix(pathname);
    setErrorMessage(null);
  };

  const goBackDirectory = () => {
    setActivePrefix(getParentPrefix(activePrefix));
    setErrorMessage(null);
  };

  const refreshGallery = () => {
    setSelectedFolderPathnames(new Set());
    setSelectedImagePathnames(new Set());
    setErrorMessage(null);
    void galleryQuery.refetch();
  };

  const createFolderMutation = useMutation({
    mutationFn: ({
      folderName,
      prefix,
    }: {
      folderName: string;
      prefix: string;
    }) => createFolder(folderName, prefix),
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async (_result, variables) => {
      setSelectedFolderPathnames(new Set());
      setSelectedImagePathnames(new Set());
      await queryClient.invalidateQueries({
        queryKey: galleryQueryKey(variables.prefix),
      });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create folder',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      folderPathnames,
      pathnames,
    }: {
      folderPathnames: string[];
      pathnames: string[];
      prefix: string;
    }) => deleteItems(folderPathnames, pathnames),
    onMutate: () => {
      setErrorMessage(null);
      setBlob(null);
    },
    onSuccess: async (_result, variables) => {
      setSelectedFolderPathnames(new Set());
      setSelectedImagePathnames(new Set());
      await queryClient.invalidateQueries({
        queryKey: galleryQueryKey(variables.prefix),
      });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Delete failed');
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      folderPathnames,
      pathnames,
      targetPrefix,
    }: {
      folderPathnames: string[];
      pathnames: string[];
      sourcePrefix: string;
      targetPrefix: string;
    }) => moveItems(folderPathnames, pathnames, targetPrefix),
    onMutate: () => {
      setErrorMessage(null);
      setBlob(null);
    },
    onSuccess: async (result, variables) => {
      setSelectedFolderPathnames(new Set());
      setSelectedImagePathnames(new Set());
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: galleryQueryKey(variables.sourcePrefix),
        }),
        queryClient.invalidateQueries({
          queryKey: galleryQueryKey(result.targetPrefix),
        }),
      ]);
      setPendingMove(null);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Move failed');
    },
  });

  const handleCreateFolder = () => {
    const folderName = window.prompt('New folder name');

    if (!folderName) return;

    createFolderMutation.mutate({
      folderName,
      prefix: activePrefix,
    });
  };

  const toggleImageSelection = (pathname: string) => {
    setSelectedImagePathnames((current) => {
      const next = new Set(current);

      if (next.has(pathname)) {
        next.delete(pathname);
      } else {
        next.add(pathname);
      }

      return next;
    });
  };

  const toggleFolderSelection = (pathname: string) => {
    setSelectedFolderPathnames((current) => {
      const next = new Set(current);

      if (next.has(pathname)) {
        next.delete(pathname);
      } else {
        next.add(pathname);
      }

      return next;
    });
  };

  const toggleAllVisibleImages = () => {
    if (allVisibleItemsSelected) {
      setSelectedFolderPathnames(
        (current) =>
          new Set(
            [...current].filter(
              (pathname) =>
                !folders.some((folder) => folder.pathname === pathname),
            ),
          ),
      );
      setSelectedImagePathnames(
        (current) =>
          new Set(
            [...current].filter(
              (pathname) =>
                !images.some((image) => image.pathname === pathname),
            ),
          ),
      );
      return;
    }

    setSelectedFolderPathnames(
      (current) =>
        new Set([...current, ...folders.map((folder) => folder.pathname)]),
    );
    setSelectedImagePathnames(
      (current) =>
        new Set([...current, ...images.map((image) => image.pathname)]),
    );
  };

  const copyImageUrl = async (pathname: string) => {
    try {
      await navigator.clipboard.writeText(getAbsoluteImageUrl(pathname));
      setCopiedImagePathname(pathname);
      window.setTimeout(() => {
        setCopiedImagePathname((current) =>
          current === pathname ? null : current,
        );
      }, 1600);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to copy URL',
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;

    const selectedFolderPathnamesList = [...selectedFolderPathnames];
    const selectedPathnames = [...selectedImagePathnames];
    const confirmed = window.confirm(
      `Delete ${selectedCount} selected item${
        selectedCount === 1 ? '' : 's'
      }? Selected folders and all of their contents will be deleted.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate({
      folderPathnames: selectedFolderPathnamesList,
      pathnames: selectedPathnames,
      prefix: activePrefix,
    });
  };

  const handleMoveSelected = () => {
    if (selectedCount === 0) return;

    setPendingMove({
      folderPathnames: [...selectedFolderPathnames],
      pathnames: [...selectedImagePathnames],
      sourcePrefix: activePrefix,
    });
    setSelectedFolderPathnames(new Set());
    setSelectedImagePathnames(new Set());
    setErrorMessage(null);
  };

  const handlePasteMoved = () => {
    if (!pendingMove || moveItemCount === 0) return;

    moveMutation.mutate({
      folderPathnames: pendingMove.folderPathnames,
      pathnames: pendingMove.pathnames,
      sourcePrefix: pendingMove.sourcePrefix,
      targetPrefix: activePrefix,
    });
  };

  const handleCancelMove = () => {
    if (moveMutation.isPending) return;

    setPendingMove(null);
  };

  const uploadImage = async (file: File, prefix: string) => {
    const compressionResult = await compressImageFile(file);
    const uploadFile = compressionResult.file;

    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(
        uploadFile.name,
      )}&prefix=${encodeURIComponent(prefix)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': uploadFile.type || 'application/octet-stream',
        },
        body: uploadFile,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Upload failed: ${file.name}`);
    }

    return {
      blob: result as UploadedBlob,
      compressed: compressionResult.compressed,
      originalSize: file.size,
      uploadSize: uploadFile.size,
      outputType: uploadFile.type || file.type || 'application/octet-stream',
    };
  };

  const uploadMutation = useMutation({
    mutationFn: async ({
      selectedFiles,
      prefix,
    }: {
      selectedFiles: File[];
      prefix: string;
    }) => {
      const uploadResults: UploadResult[] = [];

      for (const selectedFile of selectedFiles) {
        uploadResults.push(await uploadImage(selectedFile, prefix));
      }

      return uploadResults;
    },
    onMutate: () => {
      setErrorMessage(null);
      setBlob(null);
      setCompressionStats(null);
    },
    onSuccess: async (uploadResults, variables) => {
      setCompressionStats({
        originalSize: uploadResults.reduce(
          (totalSize, result) => totalSize + result.originalSize,
          0,
        ),
        uploadSize: uploadResults.reduce(
          (totalSize, result) => totalSize + result.uploadSize,
          0,
        ),
        compressed: uploadResults.some((result) => result.compressed),
        outputType:
          uploadResults.length === 1
            ? uploadResults[0].outputType
            : `${uploadResults.length} files`,
      });

      setBlob(uploadResults.at(-1)?.blob ?? null);
      setFiles([]);
      setUploadModalOpen(false);

      await queryClient.invalidateQueries({
        queryKey: galleryQueryKey(variables.prefix),
      });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof Error ? error.message : 'Upload failed',
      );
    },
  });

  const handleUpload = () => {
    if (files.length === 0) return;

    uploadMutation.mutate({
      selectedFiles: files,
      prefix: activePrefix,
    });
  };

  const handleLoadMore = () => {
    setErrorMessage(null);
    if (galleryQuery.hasNextPage && !galleryQuery.isFetchingNextPage) {
      void galleryQuery.fetchNextPage();
    }
  };

  useEffect(() => {
    setSelectedFolderPathnames(new Set());
    setSelectedImagePathnames(new Set());
  }, [activePrefix]);

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [selectedFilePreviews]);

  return (
    <>
      <Header />

      <section className="max-w-[1080px] text-left">
        <DirectoryToolbar
          activePrefix={activePrefix}
          isRootDirectory={isRootDirectory}
          loadingImages={loadingImages}
          onBack={goBackDirectory}
          onRefresh={refreshGallery}
        />

        {uploadModalOpen && (
          <UploadModal
            activePrefix={activePrefix}
            draggingFiles={draggingFiles}
            files={files}
            selectedFilePreviews={selectedFilePreviews}
            selectedFilesSize={selectedFilesSize}
            uploading={uploadMutation.isPending}
            onClose={closeUploadModal}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onSelectedFiles={setSelectedFiles}
            onUpload={handleUpload}
          />
        )}

        <UploadStatus
          blob={blob}
          compressionStats={compressionStats}
          errorMessage={errorMessage ?? queryErrorMessage}
        />

        <GalleryToolbar
          allVisibleItemsSelected={allVisibleItemsSelected}
          creatingFolder={createFolderMutation.isPending}
          deletingImages={deleteMutation.isPending}
          folderCount={folders.length}
          imageCount={images.length}
          moveItemCount={moveItemCount}
          movingItems={moveMutation.isPending}
          selectedCount={selectedCount}
          uploading={uploadMutation.isPending}
          visibleItemCount={visibleItemCount}
          onCreateFolder={handleCreateFolder}
          onCancelMove={handleCancelMove}
          onDeleteSelected={handleDeleteSelected}
          onMoveSelected={handleMoveSelected}
          onOpenUpload={() => setUploadModalOpen(true)}
          onPasteMoved={handlePasteMoved}
          onToggleAllVisible={toggleAllVisibleImages}
        />

        <GalleryGrid
          copiedImagePathname={copiedImagePathname}
          folders={folders}
          hasMore={hasMore}
          images={images}
          loadingImages={loadingImages}
          selectedFolderPathnames={selectedFolderPathnames}
          selectedImagePathnames={selectedImagePathnames}
          onCopyImageUrl={copyImageUrl}
          onLoadMore={handleLoadMore}
          onOpenFolder={openFolder}
          onToggleFolderSelection={toggleFolderSelection}
          onToggleImageSelection={toggleImageSelection}
        />
      </section>
    </>
  );
};

export default RootPage;
