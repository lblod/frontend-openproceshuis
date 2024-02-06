export default function generateBpmnDownloadUrl(fileId, fileName) {
  let url = `/files/${fileId}/download`;
  if (fileName) url += `?name=${fileName}`;
  return url;
}
