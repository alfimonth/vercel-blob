import { put } from '@vercel/blob';

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filename = searchParams.get('filename');

    if (!filename) {
      return Response.json(
        { error: 'Missing filename' },
        { status: 400 },
      );
    }

    if (!request.body) {
      return Response.json(
        { error: 'Missing request body' },
        { status: 400 },
      );
    }

    const safeName = sanitizeFileName(filename);
    const pathname = `uploads/${Date.now()}-${safeName}`;

    const contentType =
      request.headers.get('content-type') ?? 'application/octet-stream';

    const blob = await put(pathname, request.body, {
      access: 'private',
      addRandomSuffix: true,
      contentType,
    });

    return Response.json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType,
      contentDisposition: blob.contentDisposition,
      previewUrl: `/api/file?pathname=${encodeURIComponent(blob.pathname)}`,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 },
    );
  }
}