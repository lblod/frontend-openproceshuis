export default function generateFileDownloadUrl(fileId) {
  if (!fileId) return null;
  return `/files/${fileId}/download`;
}

export function generateVisioConversionUrl(
  visioFileId,
  targetExtension = 'pdf'
) {
  if (!visioFileId) return null;
  return `/visio/convert?id=${visioFileId}&target=${targetExtension}`;
}
