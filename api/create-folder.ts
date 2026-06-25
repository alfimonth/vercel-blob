import { createFolder } from '@vercel/blob';

type CreateFolderRequestBody = {
  name?: unknown;
  parentPrefix?: unknown;
};

function sanitizeFolderName(folderName: string) {
  return folderName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeUploadPrefix(prefix: unknown) {
  if (typeof prefix !== 'string' || !prefix) return '';

  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

  if (
    normalizedPrefix.startsWith('/') ||
    normalizedPrefix.includes('..')
  ) {
    return '';
  }

  return normalizedPrefix;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateFolderRequestBody;
    const parentPrefix = normalizeUploadPrefix(body.parentPrefix);

    if (typeof body.name !== 'string') {
      return Response.json(
        { error: 'Missing folder name' },
        { status: 400 },
      );
    }

    const folderName = sanitizeFolderName(body.name);

    if (!folderName) {
      return Response.json(
        { error: 'Invalid folder name' },
        { status: 400 },
      );
    }

    const folder = await createFolder(`${parentPrefix}${folderName}/`, {
      access: 'private',
    });

    return Response.json({
      pathname: folder.pathname,
      name: folderName,
      url: folder.url,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create folder',
      },
      { status: 500 },
    );
  }
}
