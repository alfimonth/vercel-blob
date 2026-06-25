const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

const replaceFileExtension = (fileName: string, extension: string) => `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;

export { formatBytes, replaceFileExtension };