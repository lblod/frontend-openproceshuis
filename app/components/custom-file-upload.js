import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fileQueue from 'ember-file-upload/helpers/file-queue';

export default class AuFileUpload extends Component {
  fileQueueHelper = fileQueue;
  @service fileQueue;
  @tracked uploadErrorData = [];

  get uploadingMsg() {
    if (this.queue.files.length)
      return `Bezig met het opladen van ${this.queue.files.length} bestand(en). (${this.queue.progress}%)`;

    if (this.args.createProcess?.isRunning) return 'Proces aanmaken ...';

    if (this.args.extractBpmnElements?.isRunning) {
      return 'Processtappen extraheren ...';
    }

    return 'Laden ...';
  }

  get title() {
    return this.args.title || 'Bestanden toevoegen';
  }

  get helpTextDragDrop() {
    return (
      this.args.helpTextDragDrop ||
      'Sleep de bestanden naar hier om toe te voegen'
    );
  }

  get helpTextFileNotSupported() {
    return (
      this.args.helpTextFileNotSupported ||
      'Dit bestandsformaat wordt niet ondersteund.'
    );
  }

  get queueName() {
    return `${guidFor(this)}-fileUploads`;
  }

  get queue() {
    return this.fileQueue.findOrCreate(this.queueName);
  }

  get endPoint() {
    return this.args.endPoint || '/files';
  }

  get maxFileSizeMB() {
    return this.args.maxFileSizeMB || 20;
  }

  get hasErrors() {
    return this.uploadErrorData.length > 0;
  }

  get isBusy() {
    return (
      this.queue.files.length ||
      this.args.createProcess?.isRunning ||
      this.args.extractBpmnElements?.isRunning
    );
  }

  @task
  *upload(file) {
    this.resetErrors();
    let uploadedFileId = yield this.uploadFileTask.perform(file);

    this.notifyQueueUpdate();

    if (uploadedFileId && this.args.onFinishUpload)
      this.args.onFinishUpload(uploadedFileId, this.calculateQueueInfo());
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *uploadFileTask(file) {
    this.notifyQueueUpdate();
    try {
      const response = yield file.upload(this.endPoint, {
        'Content-Type': 'multipart/form-data',
      });
      const body = yield response.json();
      const fileId = yield body?.data?.id;

      if (this.args.createProcess) {
        yield this.args.createProcess.perform(fileId);
      }

      if (this.args.extractBpmnElements) {
        yield this.args.extractBpmnElements.perform(fileId);
      }

      return fileId;
    } catch (e) {
      this.addError(file);
      this.removeFileFromQueue(file);
      return null;
    }
  }

  @action
  filter(file, files, index) {
    let isFirstFile = index === 0;

    if (isFirstFile) {
      this.resetErrors();
    } else {
      if (!this.args.multiple) {
        // We only upload the first file if `@multiple` is not set to true. This matches the behavior of ember-file-upload v4.
        return false;
      }
    }

    if (!isValidFileSize(file.size, this.maxFileSizeMB)) {
      this.addError(file, `Bestand is te groot (max ${this.maxFileSizeMB} MB)`);
      return false;
    }

    if (!isValidFileType(file, this.args.accept)) {
      this.addError(file, this.helpTextFileNotSupported);
      return false;
    }

    return true;
  }

  notifyQueueUpdate() {
    if (this.args.onQueueUpdate) {
      this.args.onQueueUpdate(this.calculateQueueInfo());
    }
  }

  calculateQueueInfo() {
    const filesQueueInfo = {
      isQueueEmpty: this.uploadFileTask.isIdle,
    };
    return filesQueueInfo;
  }

  addError(file, errorMessage) {
    this.uploadErrorData = [
      ...this.uploadErrorData,
      {
        filename: file.name,
        error: errorMessage,
      },
    ];
  }

  resetErrors() {
    this.uploadErrorData = [];
  }

  removeFileFromQueue(file) {
    this.queue.remove(file);
  }
}

// Private util that is exported for testing purposes
export function isValidFileType(file, accept) {
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
