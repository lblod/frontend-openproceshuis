export default function removeFileNameExtension(fileName, extension) {
  return fileName.endsWith(`.${extension}`)
    ? fileName.slice(0, fileName.length - `.${extension}`.length)
    : fileName;
}
