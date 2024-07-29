import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task, dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import downloadFileByUrl from 'frontend-openproceshuis/utils/file-downloader';
import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';

export default class ProcessesProcessIndexController extends Controller {
  queryParams = [
    { pageProcessSteps: 'process-steps-page' },
    { sizeProcessSteps: 'process-steps-size' },
    { sortProcessSteps: 'process-steps-sort' },
    { pageVersions: 'versions-page' },
    { sizeVersions: 'versions-size' },
    { sortVersions: 'versions-sort' },
    { pageAttachments: 'attachments-page' },
    { sizeAttachments: 'attachments-size' },
    { sortAttachments: 'attachments-sort' },
  ];

  @service store;
  @service router;
  @service currentSession;
  @service toaster;
  @service plausible;

  @tracked pageProcessSteps = 0;
  sizeProcessSteps = 20;
  @tracked sortProcessSteps = 'name';
  @tracked pageVersions = 0;
  sizeVersions = 10;
  @tracked sortVersions = '-created';
  @tracked pageAttachments = 0;
  sizeAttachments = 10;
  @tracked sortAttachments = 'name';

  @tracked downloadModalOpened = false;
  @tracked replaceModalOpened = false;
  @tracked addModalOpened = false;
  @tracked edit = false;
  @tracked formIsValid = false;

  downloadTypes = [
    {
      extension: 'bpmn',
      label: 'origineel',
    },
    {
      extension: 'png',
      label: 'afbeelding',
    },
    {
      extension: 'svg',
      label: 'vectorafbeelding',
    },
    {
      extension: 'pdf',
      label: 'PDF',
    },
  ];

  // Process

  get process() {
    return this.model.loadProcessTaskInstance.isFinished
      ? this.model.loadProcessTaskInstance.value
      : this.model.loadedProcess;
  }

  get processIsLoading() {
    return this.model.loadProcessTaskInstance.isRunning;
  }

  get processHasErrored() {
    return this.model.loadProcessTaskInstance.isError;
  }

  // BPMN files

  get bpmnFiles() {
    return this.model.loadBpmnFilesTaskInstance.isFinished
      ? this.model.loadBpmnFilesTaskInstance.value
      : this.model.loadedBpmnFiles;
  }

  get bpmnFilesAreLoading() {
    return this.model.loadBpmnFilesTaskInstance.isRunning;
  }

  get bpmnFilesHaveNoResults() {
    return (
      this.model.loadBpmnFilesTaskInstance.isFinished &&
      this.bpmnFiles?.length === 0
    );
  }

  get bpmnFilesHaveErrored() {
    return this.model.loadBpmnFilesTaskInstance.isError;
  }

  // Attachments

  get attachments() {
    return this.model.loadAttachmentsTaskInstance.isFinished
      ? this.model.loadAttachmentsTaskInstance.value
      : this.model.loadedAttachments;
  }

  get attachmentsAreLoading() {
    return this.model.loadAttachmentsTaskInstance.isRunning;
  }

  get attachmentsHaveNoResults() {
    return (
      this.model.loadAttachmentsTaskInstance.isFinished &&
      this.attachments?.length === 0
    );
  }

  get attachmentsHaveErrored() {
    return this.model.loadAttachmentsTaskInstance.isError;
  }

  // Latest BPMN file

  get latestBpmnFile() {
    return this.model.loadLatestBpmnFileTaskInstance.isFinished
      ? this.model.loadLatestBpmnFileTaskInstance.value
      : this.model.loadedLatestBpmnFile;
  }

  get latestBpmnFileIsLoading() {
    return this.model.loadLatestBpmnFileTaskInstance.isRunning;
  }

  get latestBpmnFileHasErrored() {
    return this.model.loadLatestBpmnFileTaskInstance.isError;
  }

  // Process steps

  get processSteps() {
    return this.model.loadProcessStepsTaskInstance.isFinished
      ? this.model.loadProcessStepsTaskInstance.value
      : this.model.loadedProcessSteps;
  }

  get processStepsBatchIsLoading() {
    return this.model.loadProcessStepsTaskInstance.isRunning;
  }

  get processStepsBatchHasNoResults() {
    return (
      this.model.loadProcessStepsTaskInstance.isFinished &&
      this.processSteps?.length === 0
    );
  }

  get processStepsBatchHasErrored() {
    return this.model.loadProcessStepsTaskInstance.isError;
  }

  // Other

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.process?.publisher &&
      this.process.publisher.id === this.currentSession.group.id
    );
  }

  @action
  openDownloadModal() {
    this.downloadModalOpened = true;
  }

  @action
  closeDownloadModal() {
    this.downloadModalOpened = false;
  }

  @action
  async downloadLatestBpmnFile(targetExtension) {
    if (!this.latestBpmnFile) return;

    const fileName = `${removeFileNameExtension(
      this.latestBpmnFile.name,
      this.latestBpmnFile.extension
    )}.${targetExtension}`;

    await this.downloadFile(
      this.latestBpmnFile.id,
      fileName,
      this.latestBpmnFile.extension,
      targetExtension
    );
  }

  @action
  async downloadOriginalFile(file) {
    await this.downloadFile(file.id, file.name, file.extension);
  }

  async downloadFile(fileId, fileName, fileExtension, targetExtension) {
    await downloadFileByUrl(fileId, fileName, fileExtension, targetExtension);

    this.plausible.trackEvent('Download bestand', {
      'Bestand-ID': fileId,
      Bestandsnaam: fileName,
      Bestandstype: fileExtension,
      Downloadtype: targetExtension ?? fileExtension,
      'Proces-ID': this.process?.id,
      Procesnaam: this.process?.title,
      'Bestuur-ID': this.process?.publisher?.id,
      Bestuursnaam: this.process?.publisher?.name,
    });
  }

  @action
  openReplaceModal() {
    this.replaceModalOpened = true;
  }

  @action
  closeReplaceModal() {
    this.replaceModalOpened = false;
  }

  @action
  openAddModal() {
    this.addModalOpened = true;
  }

  @action
  closeAddModal() {
    this.addModalOpened = false;
  }

  @dropTask
  *addFileToProcess(newFileId) {
    const newFile = yield this.store.findRecord('file', newFileId);

    this.process.files.push(newFile);
    this.process.modified = newFile.created;

    yield this.process.save();
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *extractBpmnElements(newBpmnFileId) {
    yield fetch(`/bpmn?id=${newBpmnFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @action
  fileUploaded() {
    this.replaceModalOpened = false;
    this.addModalOpened = false;

    this.pageProcessSteps = 0;
    this.router.refresh();
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
    this.validateForm();
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (!this.process) return;

    if (this.process.validate() && this.process.hasDirtyAttributes) {
      this.process.modified = new Date();

      try {
        yield this.process.save();
        this.edit = false;
        this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
          timeOut: 5000,
        });
      } catch (error) {
        console.error(error);
        this.toaster.error('Proces kon niet worden bijgewerkt', 'Fout');
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  resetModel() {
    this.process?.rollbackAttributes();
    this.replaceModalOpened = false;
    this.addModalOpened = false;
    this.edit = false;
  }

  @action
  setProcessTitle(event) {
    if (!this.process) return;
    this.process.title = event.target.value;
    this.validateForm();
  }

  @action
  setProcessDescription(event) {
    if (!this.process) return;
    this.process.description = event.target.value;
    this.validateForm();
  }

  validateForm() {
    this.formIsValid =
      this.process?.validate() && this.process?.hasDirtyAttributes;
  }
}
