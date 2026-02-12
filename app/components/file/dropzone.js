import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { guidFor } from '@ember/object/internals';
import { task } from 'ember-concurrency';

import fileQueue from 'ember-file-upload/helpers/file-queue';

const maxFileSizeMB = 20;

export default class FileDropzone extends Component {
  fileQueueHelper = fileQueue;

  @service fileQueue;
  @service toaster;

  upload = task({ enqueue: true }, async (fileWrapper) => {
    const forbidden = this.args.forbidden?.split(',') ?? [];

    if (forbidden.includes('.bpmn') && fileWrapper.name.endsWith('.bpmn')) {
      this.toaster.error(
        fileWrapper.name,
        'BPMN-bestanden kunnen niet worden toegevoegd aan bijlagen.',
        { timeOut: 2500 },
      );
      this.removeFileFromQueue(fileWrapper);
      return;
    } else if (
      forbidden.includes('.vsdx') &&
      fileWrapper.name.endsWith('.vsdx')
    ) {
      this.toaster.error(
        fileWrapper.name,
        'Visiobestanden kunnen niet worden toegevoegd aan bijlagen.',
        { timeOut: 2500 },
      );
      this.removeFileFromQueue(fileWrapper);
      return;
    }
    this.args.onFileUploaded?.(this.queue.fileQueue.files);
  });

  @action
  filter(fileWrapper) {
    if (!this.args.multiple) {
      // We only upload the first file if `@multiple` is not set to true. This matches the behavior of ember-file-upload v4.
      return false;
    }

    if (!isValidFileSize(fileWrapper.size, maxFileSizeMB)) {
      this.toaster.error(
        fileWrapper.name,
        `Bestand is te groot (max ${maxFileSizeMB} MB)`,
        { timeOut: 2500 },
      );
      return false;
    }

    if (!isValidFileType(fileWrapper, this.args.accept)) {
      this.toaster.error(
        fileWrapper.name,
        'Dit bestandsformaat wordt niet ondersteund.',
        { timeOut: 2500 },
      );
      return false;
    }

    return true;
  }

  get uploadingMsg() {
    if (this.queue.files.length)
      return `Bezig met het opladen van ${this.queue.files.length} bestand(en). (${this.queue.progress}%)`;

    return 'Laden ...';
  }

  get queueName() {
    return `${guidFor(this)}-fileUploads`;
  }

  get queue() {
    return this.fileQueue.findOrCreate(this.queueName);
  }

  removeFileFromQueue = (fileWrapper) => {
    if (!fileWrapper) {
      return;
    }
    this.queue.remove(fileWrapper);
    this.args.onFileUploaded?.(this.queue.fileQueue.files);
  };
}

function isValidFileType(file, accept) {
  if (!accept) {
    return true;
  }

  let tokens = accept.split(',').map(function (token) {
    return token.trim().toLowerCase();
  });

  let validMimeTypes = tokens.filter(function (token) {
    return !token.startsWith('.');
  });
  let type = file.type?.toLowerCase();

  let validExtensions = tokens.filter(function (token) {
    return token.startsWith('.');
  });

  let extension = null;
  if (file.name && /(\.[^.]+)$/.test(file.name)) {
    extension = file.name.toLowerCase().match(/(\.[^.]+)$/)[1];
  }

  return (
    isValidMimeType(type, validMimeTypes) ||
    isValidExtension(extension, validExtensions)
  );
}

function isValidMimeType(type, validMimeTypes = []) {
  return validMimeTypes.some(function (validType) {
    if (['audio/*', 'video/*', 'image/*'].includes(validType)) {
      let genericType = validType.split('/')[0];

      return type.startsWith(genericType);
    } else {
      return type === validType;
    }
  });
}

function isValidExtension(extension, validExtensions = []) {
  return validExtensions.includes(extension);
}

function isValidFileSize(fileSize, maximumSize) {
  return fileSize < maximumSize * Math.pow(1024, 2);
}
