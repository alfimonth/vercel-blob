import { get } from '@vercel/blob';

function getDownloadFileName(pathname: string) {
  return pathname.split('/').at(-1)?.replace(/"/g, '') || 'image';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const pathname = searchParams.get('pathname');
    const shouldDownload = searchParams.get('download') === '1';

    if (!pathname) {
      return Response.json(
        { error: 'Missing pathname' },
        { status: 400 },
      );
    }

    const result = await get(pathname, {
      access: 'private',
    });

    if (result?.statusCode !== 200) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        ...(shouldDownload
          ? {
              'Content-Disposition': `attachment; filename="${getDownloadFileName(
                pathname,
              )}"`,
            }
          : {}),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load file',
      },
      { status: 500 },
    );
  }
}
