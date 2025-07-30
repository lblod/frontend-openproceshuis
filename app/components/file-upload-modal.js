import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fileQueue from 'ember-file-upload/helpers/file-queue';
import BpmnViewerModifier from './bpmn-viewer';

export default class FileUploadModalComponent extends Component {
  bpmnViewer = BpmnViewerModifier;
  fileQueueHelper = fileQueue;
  @service fileQueue;
  @service api;
  @tracked uploadErrorData = [];
  @tracked showDropzone = true;
  @tracked preview = undefined;

  @tracked fileHasSensitiveInformation = false;
  @tracked sensitiveDataResults = [];
  @tracked sensitiveDataToAnonymize = [];

  get uploadingMsg() {
    if (this.queue.files.length && !this.detectSensitiveDataInFile?.isRunning)
      return `Bezig met het opladen van ${this.queue.files.length} bestand(en). (${this.queue.progress}%)`;

    if (this.args.updateProcess?.isRunning) return 'Proces bijwerken ...';

    if (this.args.createProcess?.isRunning) return 'Proces aanmaken ...';

    if (this.args.extractBpmnElements?.isRunning) {
      return 'Processtappen extraheren ...';
    }

    if (this.detectSensitiveDataInFile?.isRunning) {
      return 'Detecteren van gevoelige informatie in bestand ...';
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
      this.args.updateProcess?.isRunning ||
      this.args.createProcess?.isRunning ||
      this.args.extractBpmnElements?.isRunning
    );
  }

  @task
  *detectSensitiveDataInFile(process) {
    try {
      const formData = new FormData();
      formData.append('file', process.file);

      const response = yield this.api.fetch('/anonymization/bpmn/identify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Sensitive information detection failed! Status: ${response.status}`,
        );
      }

      const sensitiveDataResults = yield response.json();
      return sensitiveDataResults;
    } catch (error) {
      console.error('Error detecting sensitive data:', error);
      throw error;
    }
  }

  @task
  *upload(file) {
    this.resetErrors();

    const forbidden = this.args.forbidden?.split(',') ?? [];

    if (forbidden.includes('.bpmn') && file.name.endsWith('.bpmn')) {
      this.addError(
        file,
        'BPMN-bestanden kunnen niet worden toegevoegd aan bijlagen.',
      );
      this.removeFileFromQueue(file);
      return;
    } else if (forbidden.includes('.vsdx') && file.name.endsWith('.vsdx')) {
      this.addError(
        file,
        'Visiobestanden kunnen niet worden toegevoegd aan bijlagen.',
      );
      this.removeFileFromQueue(file);
      return;
    }

    let checkedFile = file;

    if (file.name.endsWith('.bpmn')) {
      try {
        const response = yield this.detectSensitiveDataInFile.perform(file);
        const results = response['pii_results'];
        if (results.length > 0) {
          this.showDropzone = false;
          this.preview = yield file.file.text();

          this.sensitiveDataResults = results;
          this.fileHasSensitiveInformation = true;
          this.sensitiveDataToAnonymize = [...results];
          return;
        }
      } catch (error) {
        this.addError(file, 'Error during sensitive data detection.');
        this.removeFileFromQueue(file);
        return;
      }
    }

    let fileId;
    try {
      fileId = yield this.uploadFileTask.perform(checkedFile);
    } catch {
      this.addError(
        file,
        'Er ging iets mis tijdens het opslaan van het bestand.',
      );
      this.removeFileFromQueue(checkedFile);
      return;
    }

    if (this.args.updateProcess) {
      try {
        yield this.args.updateProcess.perform(fileId);
      } catch {
        this.addError(
          checkedFile,
          'Er ging iets mis tijdens het bijwerken van het proces.',
        );
        this.removeFileFromQueue(file);
        return;
      }
    } else if (this.args.createProcess) {
      try {
        yield this.args.createProcess.perform(fileId);
      } catch {
        this.addError(
          checkedFile,
          'Er ging iets mis tijdens het aanmaken van het proces.',
        );
        this.removeFileFromQueue(checkedFile);
        return;
      }
    }

    let bpmnFileId = fileId;
    if (file.name.endsWith('.vsdx')) {
      try {
        bpmnFileId = yield this.convertVisioToBpmn.perform(fileId);
      } catch (e) {
        console.error(e);
        bpmnFileId = null;
      }
    }

    if (this.args.extractBpmnElements && bpmnFileId) {
      yield this.args.extractBpmnElements.perform(bpmnFileId);
    }

    this.notifyQueueUpdate();

    if (fileId && this.args.onFinishUpload)
      this.args.onFinishUpload(fileId, this.calculateQueueInfo());
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *uploadFileTask(file) {
    const response = yield file.upload(this.endPoint, {
      'Content-Type': 'multipart/form-data',
    });
    const body = yield response.json();
    return body?.data?.id;
  }

  @task
  *convertVisioToBpmn(visioFileId) {
    const response = yield this.api.fetch(`/visio?id=${visioFileId}`, {
      method: 'POST',
    });
    const body = yield response.json();
    return body['bpmn-file-id'];
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

  @action
  handleSensitiveDataSelection(result, isChecked) {
    if (isChecked) {
      this.sensitiveDataToAnonymize = [
        ...this.sensitiveDataToAnonymize,
        result,
      ];
    } else {
      this.sensitiveDataToAnonymize = this.sensitiveDataToAnonymize.filter(
        (item) => item !== result,
      );
    }
  }

  @action
  handleAnonymization() {
    console.log('anonymize...');
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
    this.sensitiveDataResults = null;
  }

  removeFileFromQueue(file) {
    this.queue.remove(file);
    this.notifyQueueUpdate();
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
