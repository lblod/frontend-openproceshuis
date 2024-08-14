export function isOnlyWhitespace(str) {
  if (!str) return false; // undefined, null or ''
  if (str.trim() !== '') return false; // non-whitespace characters present
  return true;
}

export function isEmptyOrEmail(str) {
  if (!str) return true; // undefined, null or ''
  if (
    String(str).match(
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ // email format
    ) !== null
  )
    return true;
  return false;
}
