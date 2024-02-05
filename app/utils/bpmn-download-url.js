export default function generateBpmnDownloadUrl(fileId) {
  const baseUrl = '/files';
  return `${baseUrl}/${fileId}/download`;
}
