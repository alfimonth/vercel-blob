import { del } from '@vercel/blob';

type DeleteRequestBody = {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeleteRequestBody;

    if (!Array.isArray(body.pathnames)) {
      return Response.json(
        { error: 'Missing pathnames' },
        { status: 400 },
      );
    }

    const pathnames = body.pathnames.filter(isValidUploadPath);

    if (pathnames.length === 0) {
      return Response.json(
        { error: 'No valid images selected' },
        { status: 400 },
      );
    }

    await del(pathnames);

    return Response.json({
      deleted: pathnames.length,
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
