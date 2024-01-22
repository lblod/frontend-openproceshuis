import config from 'frontend-processendatabank/config/environment';

export default function generateBpmnDownloadUrl(fileId) {
  const baseUrl = `${config.APP.apiHost}/bpmn-files`;
  return `${baseUrl}/${fileId}/download`;
}
