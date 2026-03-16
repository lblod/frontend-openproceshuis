export function toSafeString(unsafeString) {
  if (!unsafeString) {
    return unsafeString;
  }

  return unsafeString.replace(/[^a-zA-Z0-9]/g, '');
}
