import generateFileDownloadUrl from './file-download-url';

export default async function downloadFileByUrl(
  fileId,
  fileName,
  mimeType,
  conversionNecessary
) {
  const url = generateFileDownloadUrl(fileId, conversionNecessary);
  const headers = mimeType ? { Accept: mimeType } : {};

  const response = await fetch(url, { headers });
  if (!response.ok) throw Error(response.status);

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  a.remove();
}
