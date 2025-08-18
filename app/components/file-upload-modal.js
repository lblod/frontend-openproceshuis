import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import fileQueue from 'ember-file-upload/helpers/file-queue';
import { UploadFile } from 'ember-file-upload';
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
    if (this.queue.files.length && !this.detectSensitiveData?.isRunning)
      return `Bezig met het opladen van ${this.queue.files.length} bestand(en). (${this.queue.progress}%)`;

    if (this.args.updateProcess?.isRunning) return 'Proces bijwerken ...';

    if (this.args.createProcess?.isRunning) return 'Proces aanmaken ...';

    if (this.args.extractBpmnElements?.isRunning) {
      return 'Processtappen extraheren ...';
    }

    if (this.detectSensitiveData?.isRunning) {
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
  *upload(fileWrapper) {
    this.resetErrors();

    const forbidden = this.args.forbidden?.split(',') ?? [];

    if (forbidden.includes('.bpmn') && fileWrapper.name.endsWith('.bpmn')) {
      this.addError(
        fileWrapper,
        'BPMN-bestanden kunnen niet worden toegevoegd aan bijlagen.',
      );
      this.removeFileFromQueue(fileWrapper);
      return;
    } else if (
      forbidden.includes('.vsdx') &&
      fileWrapper.name.endsWith('.vsdx')
    ) {
      this.addError(
        fileWrapper,
        'Visiobestanden kunnen niet worden toegevoegd aan bijlagen.',
      );
      this.removeFileFromQueue(fileWrapper);
      return;
    }

    if (fileWrapper.name.endsWith('.bpmn')) {
      try {
        const response = yield this.detectSensitiveData.perform(
          fileWrapper.file,
        );
        const results = response['pii_results'];
        if (results.length > 0) {
          this.showDropzone = false;
          this.preview = yield fileWrapper.file.text();

          this.sensitiveDataResults = results;
          this.fileHasSensitiveInformation = true;
          this.sensitiveDataToAnonymize = [...results];
        }
      } catch (error) {
        this.addError(fileWrapper, 'Error during sensitive data detection.');
        this.removeFileFromQueue(fileWrapper);
      }
      return;
    }

    yield this.processFile.perform(fileWrapper);
  }

  @task
  *processFile(fileWrapper) {
    let fileId;
    try {
      fileId = yield this.uploadFileTask.perform(fileWrapper);
    } catch {
      this.addError(
        fileWrapper,
        'Er ging iets mis tijdens het opslaan van het bestand.',
      );
      this.removeFileFromQueue(fileWrapper);
      return;
    }

    if (this.args.updateProcess) {
      try {
        yield this.args.updateProcess.perform(fileId);
      } catch {
        this.addError(
          fileWrapper,
          'Er ging iets mis tijdens het bijwerken van het proces.',
        );
        this.removeFileFromQueue(fileWrapper);
        return;
      }
    } else if (this.args.createProcess) {
      try {
        yield this.args.createProcess.perform(fileId);
      } catch {
        this.addError(
          fileWrapper,
          'Er ging iets mis tijdens het aanmaken van het proces.',
        );
        this.removeFileFromQueue(fileWrapper);
        return;
      }
    }

    let bpmnFileId = fileId;
    if (fileWrapper.name.endsWith('.vsdx')) {
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

  @task
  *detectSensitiveData(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = yield this.api.fetch('/anonymization/bpmn/identify', {
      method: 'POST',
      body: formData,
    });
    const sensitiveDataResults = yield response.json();
    return sensitiveDataResults;
  }

  @task
  *maskSensitiveData() {
    const originalFileWrapper = this.queue.files[0];

    const formData = new FormData();
    formData.append('file', originalFileWrapper.file, originalFileWrapper.name);
    formData.append('pointers', JSON.stringify(this.sensitiveDataToAnonymize));

    const response = yield fetch('/anonymization/bpmn/anonymize', {
      method: 'POST',
      body: formData,
    });

    const maskedFileWrapper = UploadFile.fromBlob(yield response.blob());
    maskedFileWrapper.name = originalFileWrapper.name;

    this.removeFileFromQueue(originalFileWrapper);
    this.queue.add(maskedFileWrapper);

    this.fileHasSensitiveInformation = false;
    this.sensitiveDataResults = [];
    this.sensitiveDataToAnonymize = [];
    this.preview = undefined;
    this.showDropzone = true;

    yield this.processFile.perform(maskedFileWrapper);
  }

  @action
  closeModal() {
    this.queue.files.slice().forEach((file) => this.removeFileFromQueue(file));
    this.upload.cancelAll();
    this.detectSensitiveData.cancelAll();

    this.uploadErrorData = [];
    this.showDropzone = true;
    this.preview = undefined;
    this.fileHasSensitiveInformation = false;
    this.sensitiveDataResults = [];
    this.sensitiveDataToAnonymize = [];

    this.args.closeModal();
  }

  @action
  filter(fileWrapper, files, index) {
    let isFirstFile = index === 0;

    if (isFirstFile) {
      this.resetErrors();
    } else {
      if (!this.args.multiple) {
        // We only upload the first file if `@multiple` is not set to true. This matches the behavior of ember-file-upload v4.
        return false;
      }
    }

    if (!isValidFileSize(fileWrapper.size, this.maxFileSizeMB)) {
      this.addError(
        fileWrapper,
        `Bestand is te groot (max ${this.maxFileSizeMB} MB)`,
      );
      return false;
    }

    if (!isValidFileType(fileWrapper, this.args.accept)) {
      this.addError(fileWrapper, this.helpTextFileNotSupported);
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

  addError(fileWrapper, errorMessage) {
    this.uploadErrorData = [
      ...this.uploadErrorData,
      {
        filename: fileWrapper.name,
        error: errorMessage,
      },
    ];
  }

  resetErrors() {
    this.uploadErrorData = [];
    this.sensitiveDataResults = null;
  }

  removeFileFromQueue(fileWrapper) {
    this.queue.remove(fileWrapper);
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
