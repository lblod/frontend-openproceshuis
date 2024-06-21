export default function generateFileDownloadUrl(fileId, conversionNecessary) {
  if (conversionNecessary) return `/files/${fileId}/converted/download`;
  return `/files/${fileId}/download`;
}
