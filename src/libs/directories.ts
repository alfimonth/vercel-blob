import { ROOT_PREFIX } from "../config";

const getParentPrefix = (prefix: string) => {
  const parts = prefix.replace(/\/$/, '').split('/');

  if (!prefix || parts.length <= 1) {
    return ROOT_PREFIX;
  }

  return `${parts.slice(0, -1).join('/')}/`;
}

const formatDirectory = (prefix: string) => {
  if (!prefix) return 'root';

  return `root/${prefix.replace(/\/$/, '')}`;
}

export { getParentPrefix, formatDirectory }