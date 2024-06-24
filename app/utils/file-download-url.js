export default function generateFileDownloadUrl(
  fileId,
  fileExtension,
  targetExtension
) {
  if (!fileId) return null;

  if (fileExtension && targetExtension && fileExtension !== targetExtension)
    return `/files/${fileId}/converted/download`;

  return `/files/${fileId}/download`;
}
