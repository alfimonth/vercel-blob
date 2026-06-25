const getImageUrl = (pathname: string, options?: { download?: boolean }) => {
  const params = new URLSearchParams();
  params.set('pathname', pathname);

  if (options?.download) {
    params.set('download', '1');
  }

  return `/api/file?${params.toString()}`;
}

const getAbsoluteImageUrl = (pathname: string) => new URL(getImageUrl(pathname), window.location.origin).toString();

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Failed to read selected image'));
  };
  image.src = url;
});


const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Failed to compress image'));
    },
    type,
    quality,
  );
});

export {
  getImageUrl,
  getAbsoluteImageUrl,
  loadImage,
  canvasToBlob
}