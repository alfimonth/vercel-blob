import { list } from '@vercel/blob';

function isImagePath(pathname: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(pathname);
}

function normalizeUploadPrefix(prefix: string | null) {
  if (!prefix) return '';

  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

  if (
    normalizedPrefix.startsWith('/') ||
    normalizedPrefix.includes('..')
  ) {
    return '';
  }

  return normalizedPrefix;
}

function getFolderName(pathname: string) {
  return pathname.replace(/\/$/, '').split('/').at(-1) ?? pathname;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get('cursor') ?? undefined;
    const prefix = normalizeUploadPrefix(searchParams.get('prefix'));

    const result = await list({
      access: 'private',
      prefix,
      cursor,
      limit: 20,
      mode: 'folded',
    });

    const folders = result.folders
      .map((pathname) => ({
        pathname,
        name: getFolderName(pathname),
      }))
      .sort((first, second) => first.name.localeCompare(second.name));

    const images = result.blobs
      .filter((blob) => isImagePath(blob.pathname))
      .map((blob) => ({
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        previewUrl: `/api/file?pathname=${encodeURIComponent(blob.pathname)}`,
      }))
      .sort((first, second) => {
        const dateDifference =
          new Date(second.uploadedAt).getTime() -
          new Date(first.uploadedAt).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return second.pathname.localeCompare(first.pathname);
      });

    return Response.json({
      folders,
      images,
      cursor: result.cursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to list images',
      },
      { status: 500 },
    );
  }
}
