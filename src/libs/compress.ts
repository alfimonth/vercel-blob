import { COMPRESSIBLE_IMAGE_TYPES, IMAGE_QUALITY, MAX_IMAGE_DIMENSION } from "../config";
import { replaceFileExtension } from "./files";
import { canvasToBlob, loadImage } from "./images";

const compressImageFile = async (file: File) => {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) {
    return { file, compressed: false };
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Browser does not support image compression');
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = 'image/webp';
  const compressedBlob = await canvasToBlob(
    canvas,
    outputType,
    IMAGE_QUALITY,
  );

  if (compressedBlob.size >= file.size) {
    return { file, compressed: false };
  }

  return {
    file: new File(
      [compressedBlob],
      replaceFileExtension(file.name, 'webp'),
      {
        type: outputType,
        lastModified: Date.now(),
      },
    ),
    compressed: true,
  };
}

export { compressImageFile }