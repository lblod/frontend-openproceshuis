export function isOnlyWhitespace(str) {
  if (!str) return false; // undefined, null or ''
  if (str.trim() !== '') return false; // non-whitespace characters present
  return true;
}
