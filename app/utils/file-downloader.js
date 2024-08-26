import { downloadZip } from 'client-zip';
import generateFileDownloadUrl from './file-download-url';

export async function downloadFileByUrl(fileId, fileName) {
  const fileBlob = await fetchFileBlobByUrl(fileId);
  initiateDownload(fileBlob, fileName);
}

export async function downloadFilesAsZip(files) {
  const filesToZip = await Promise.all(
    files.map(async (file) => {
      const fileBlob = await fetchFileBlobByUrl(file.id);
      return {
        name: file.name,
        input: fileBlob,
      };
    })
  );
  const zipBlob = await downloadZip(filesToZip).blob();
  initiateDownload(zipBlob, 'test.zip');
}

async function fetchFileBlobByUrl(fileId) {
  const url = generateFileDownloadUrl(fileId);

  const response = await fetch(url);
  if (!response.ok) throw Error(response.status);

  return await response.blob();
}

function initiateDownload(blob, fileName) {
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
