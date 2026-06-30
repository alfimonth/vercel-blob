import { copy, createFolder, del, list } from '@vercel/blob';

type MoveRequestBody = {
  folderPathnames?: unknown;
  pathnames?: unknown;
  targetPrefix?: unknown;
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

function isFilePath(pathname: string) {
  return !pathname.endsWith('/');
}

function normalizeUploadPrefix(prefix: unknown) {
  if (typeof prefix !== 'string') return '';

  const trimmedPrefix = prefix.trim();
  if (!trimmedPrefix) return '';

  const normalizedPrefix = trimmedPrefix.endsWith('/')
    ? trimmedPrefix
    : `${trimmedPrefix}/`;

  if (
    normalizedPrefix.startsWith('/') ||
    normalizedPrefix.includes('..') ||
    normalizedPrefix.includes('//')
  ) {
    return '';
  }

  return normalizedPrefix;
}

function getFileName(pathname: string) {
  return pathname.split('/').at(-1) ?? pathname;
}

function getFolderName(pathname: string) {
  return pathname.replace(/\/$/, '').split('/').at(-1) ?? pathname;
}

async function listFolderPathnames(prefix: string) {
  const pathnames: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix,
      cursor,
      limit: 1000,
    });

    pathnames.push(...result.blobs.map((blob) => blob.pathname));
    cursor = result.cursor;
  } while (cursor);

  return pathnames;
}

async function moveFile(pathname: string, targetPrefix: string) {
  if (!isFilePath(pathname)) {
    throw new Error('Missing filename in selected file path');
  }

  const targetPathname = `${targetPrefix}${getFileName(pathname)}`;

  if (targetPathname === pathname) {
    throw new Error('File is already in the target folder');
  }

  const result = await copy(pathname, targetPathname, {
    access: 'private',
    allowOverwrite: false,
  });

  return result.pathname;
}

async function moveFolder(folderPathname: string, targetPrefix: string) {
  const folderName = getFolderName(folderPathname);
  const targetFolderPathname = `${targetPrefix}${folderName}/`;

  if (
    targetFolderPathname === folderPathname ||
    targetFolderPathname.startsWith(folderPathname)
  ) {
    throw new Error('Folder cannot be moved into itself');
  }

  await createFolder(targetFolderPathname, {
    access: 'private',
  });

  const folderContents = await listFolderPathnames(folderPathname);
  const folderFiles = folderContents.filter(isFilePath);
  const copiedPathnames = await Promise.all(
    folderFiles.map(async (sourcePathname) => {
      const relativePathname = sourcePathname.slice(folderPathname.length);
      const targetPathname = `${targetFolderPathname}${relativePathname}`;
      const result = await copy(sourcePathname, targetPathname, {
        access: 'private',
        allowOverwrite: false,
      });

      return result.pathname;
    }),
  );

  return [targetFolderPathname, ...copiedPathnames];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoveRequestBody;

    if (!Array.isArray(body.pathnames) && !Array.isArray(body.folderPathnames)) {
      return Response.json(
        { error: 'Missing move targets' },
        { status: 400 },
      );
    }

    const targetPrefix = normalizeUploadPrefix(body.targetPrefix);
    const pathnames = Array.isArray(body.pathnames)
      ? body.pathnames.filter(isValidUploadPath)
      : [];
    const folderPathnames = Array.isArray(body.folderPathnames)
      ? body.folderPathnames.filter(isValidFolderPath)
      : [];

    if (pathnames.length === 0 && folderPathnames.length === 0) {
      return Response.json(
        { error: 'No valid files or folders selected' },
        { status: 400 },
      );
    }

    const movedFiles = await Promise.all(
      pathnames.map((pathname) => moveFile(pathname, targetPrefix)),
    );
    const movedFolders = await Promise.all(
      folderPathnames.map((folderPathname) =>
        moveFolder(folderPathname, targetPrefix),
      ),
    );
    const sourcePathnames = [
      ...pathnames,
      ...folderPathnames,
      ...(await Promise.all(folderPathnames.map(listFolderPathnames))).flat(),
    ];

    await del([...new Set(sourcePathnames)]);

    return Response.json({
      moved: movedFiles.length + movedFolders.flat().length,
      targetPrefix,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Move failed',
      },
      { status: 500 },
    );
  }
}
