import { del, list } from '@vercel/blob';

type DeleteRequestBody = {
  folderPathnames?: unknown;
  pathnames?: unknown;
};

function isValidUploadPath(pathname: unknown): pathname is string {
  return (
    typeof pathname === 'string' &&
    pathname.length > 0 &&
    !pathname.startsWith('/') &&
    !pathname.includes('..')
  );
}

function isValidFolderPath(pathname: unknown): pathname is string {
  return (
    typeof pathname === 'string' &&
    pathname.length > 0 &&
    pathname.endsWith('/') &&
    !pathname.startsWith('/') &&
    !pathname.includes('..')
  );
}

async function listFolderPathnames(prefix: string) {
  const pathnames: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      access: 'private',
      prefix,
      cursor,
      limit: 1000,
    });

    pathnames.push(...result.blobs.map((blob) => blob.pathname));
    cursor = result.cursor;
  } while (cursor);

  return pathnames;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeleteRequestBody;

    if (!Array.isArray(body.pathnames) && !Array.isArray(body.folderPathnames)) {
      return Response.json(
        { error: 'Missing delete targets' },
        { status: 400 },
      );
    }

    const pathnames = Array.isArray(body.pathnames)
      ? body.pathnames.filter(isValidUploadPath)
      : [];
    const folderPathnames = Array.isArray(body.folderPathnames)
      ? body.folderPathnames.filter(isValidFolderPath)
      : [];
    const folderContents = await Promise.all(
      folderPathnames.map((folderPathname) =>
        listFolderPathnames(folderPathname),
      ),
    );
    const deletePathnames = [
      ...new Set([...pathnames, ...folderContents.flat(), ...folderPathnames]),
    ];

    if (deletePathnames.length === 0) {
      return Response.json(
        { error: 'No valid files or folders selected' },
        { status: 400 },
      );
    }

    await del(deletePathnames);

    return Response.json({
      deleted: deletePathnames.length,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 },
    );
  }
}
