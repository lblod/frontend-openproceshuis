export default function generateFileDownloadUrl(fileId) {
  if (!fileId) return null;
  return `/files/${fileId}/download`;
}
