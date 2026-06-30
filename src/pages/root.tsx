import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';

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
  DeleteResponse,
  GalleryFolder,
  GalleryImage,
  ListResponse,
  UploadedBlob,
} from '../types';

const RootPage = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [blob, setBlob] = useState<UploadedBlob | null>(null);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);

  const [activePrefix, setActivePrefix] = useState(ROOT_PREFIX);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedFolderPathnames, setSelectedFolderPathnames] = useState<
    Set<string>
  >(new Set());
  const [selectedImagePathnames, setSelectedImagePathnames] = useState<
    Set<string>
  >(new Set());
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingImages, setDeletingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedImagePathname, setCopiedImagePathname] = useState<string | null>(
    null,
  );

  const selectedCount =
    selectedFolderPathnames.size + selectedImagePathnames.size;
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
    if (uploading) return;

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

  const loadImages = async (options?: { reset?: boolean; prefix?: string }) => {
    setLoadingImages(true);
    setErrorMessage(null);

    try {
      const prefix = options?.prefix ?? activePrefix;
      const params = new URLSearchParams();
      params.set('prefix', prefix);

      if (!options?.reset && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/list?${params.toString()}`);
      const result = (await response.json()) as ListResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load images');
      }

      setFolders(options?.reset ? result.folders : folders);
      setImages((current) =>
        options?.reset ? result.images : [...current, ...result.images],
      );
      if (options?.reset) {
        setSelectedFolderPathnames(new Set());
        setSelectedImagePathnames(new Set());
      }
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load images',
      );
    } finally {
      setLoadingImages(false);
    }
  };

  const openFolder = (pathname: string) => {
    setActivePrefix(pathname);
    setCursor(undefined);
    void loadImages({ reset: true, prefix: pathname });
  };

  const goBackDirectory = () => {
    const parentPrefix = getParentPrefix(activePrefix);
    setActivePrefix(parentPrefix);
    setCursor(undefined);
    void loadImages({ reset: true, prefix: parentPrefix });
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt('New folder name');

    if (!folderName) return;

    setCreatingFolder(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parentPrefix: activePrefix,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create folder');
      }

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create folder',
      );
    } finally {
      setCreatingFolder(false);
    }
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

    setDeletingImages(true);
    setErrorMessage(null);
    setBlob(null);

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPathnames: selectedFolderPathnamesList,
          pathnames: selectedPathnames,
        }),
      });

      const result = (await response.json()) as DeleteResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      setImages((current) =>
        current.filter(
          (image) => !selectedImagePathnames.has(image.pathname),
        ),
      );
      setFolders((current) =>
        current.filter(
          (folder) => !selectedFolderPathnames.has(folder.pathname),
        ),
      );
      setSelectedFolderPathnames(new Set());
      setSelectedImagePathnames(new Set());

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Delete failed',
      );
    } finally {
      setDeletingImages(false);
    }
  };

  const uploadImage = async (file: File) => {
    const compressionResult = await compressImageFile(file);
    const uploadFile = compressionResult.file;

    const response = await fetch(
      `/api/upload?filename=${encodeURIComponent(
        uploadFile.name,
      )}&prefix=${encodeURIComponent(activePrefix)}`,
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

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    setBlob(null);
    setCompressionStats(null);

    try {
      const uploadResults = [];

      for (const selectedFile of files) {
        uploadResults.push(await uploadImage(selectedFile));
      }

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

      await loadImages({ reset: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadImages({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onRefresh={() => loadImages({ reset: true })}
        />

        {uploadModalOpen && (
          <UploadModal
            activePrefix={activePrefix}
            draggingFiles={draggingFiles}
            files={files}
            selectedFilePreviews={selectedFilePreviews}
            selectedFilesSize={selectedFilesSize}
            uploading={uploading}
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
          errorMessage={errorMessage}
        />

        <GalleryToolbar
          allVisibleItemsSelected={allVisibleItemsSelected}
          creatingFolder={creatingFolder}
          deletingImages={deletingImages}
          folderCount={folders.length}
          imageCount={images.length}
          selectedCount={selectedCount}
          uploading={uploading}
          visibleItemCount={visibleItemCount}
          onCreateFolder={handleCreateFolder}
          onDeleteSelected={handleDeleteSelected}
          onOpenUpload={() => setUploadModalOpen(true)}
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
          onLoadMore={() => loadImages()}
          onOpenFolder={openFolder}
          onToggleFolderSelection={toggleFolderSelection}
          onToggleImageSelection={toggleImageSelection}
        />
      </section>
    </>
  );
};

export default RootPage;
