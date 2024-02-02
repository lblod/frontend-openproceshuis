export default function generateBpmnDownloadUrl(fileId) {
  const baseUrl = '/bpmn-files';
  return `${baseUrl}/${fileId}/download`;
}
