import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import {
  dropTask,
  enqueueTask,
  keepLatestTask,
  timeout,
} from 'ember-concurrency';
import { inject as service } from '@ember/service';
import FileSaver from 'file-saver';
import ENV from 'frontend-openproceshuis/config/environment';
import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';
import {
  downloadFileByUrl,
  downloadFilesAsZip,
} from 'frontend-openproceshuis/utils/file-downloader';
import {
  convertSvgToPdf,
  convertSvgToPng,
} from 'frontend-openproceshuis/utils/svg-convertors';

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

  @tracked downloadModalOpened = false;
  @tracked replaceModalOpened = false;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;

  @tracked edit = false;
  @tracked formIsValid = false;
  @tracked fileToDelete = undefined;

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

  // Latest diagram

  @tracked latestDiagram = undefined;
  @tracked latestDiagramIsLoading = true;
  @tracked latestDiagramHasErrored = false;

  latestDiagramAsBpmn = undefined;
  latestDiagramAsSvg = undefined;

  @action
  setLatestDiagramAsBpmn(value) {
    this.latestDiagramAsBpmn = value;
  }

  @action
  setLatestDiagramAsSvg(value) {
    this.latestDiagramAsSvg = value;
  }

  // Process steps

  @tracked pageProcessSteps = 0;
  @tracked sortProcessSteps = 'name';
  sizeProcessSteps = 20;

  @tracked processSteps = undefined;
  @tracked processStepsAreLoading = true;
  @tracked processStepsHaveErrored = false;

  get processStepsHaveNoResults() {
    return (
      !this.processStepsAreLoading &&
      !this.processStepsHaveErrored &&
      this.processSteps?.length === 0
    );
  }

  // Diagram versions

  @tracked pageVersions = 0;
  @tracked sortVersions = '-created';
  sizeVersions = 10;

  @tracked diagrams = undefined;
  @tracked diagramsAreLoading = true;
  @tracked diagramsHaveErrored = false;

  get diagramsHaveNoResults() {
    return (
      !this.diagramsAreLoading &&
      !this.diagramsHaveErrored &&
      this.diagrams?.length === 0
    );
  }

  // Attachments

  @tracked pageAttachments = 0;
  @tracked sortAttachments = 'name';
  sizeAttachments = 10;

  @tracked attachments = undefined;
  @tracked attachmentsAreLoading = true;
  @tracked attachmentsHaveErrored = false;

  get attachmentsHaveNoResults() {
    return (
      !this.attachmentsAreLoading &&
      !this.attachmentsHaveErrored &&
      this.attachments?.length === 0
    );
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
  async downloadFile(file) {
    await downloadFileByUrl(file.id, file.name);
    this.trackDownloadFileEvent(file.id, file.name, file.extension);
  }

  @dropTask
  *downloadLatestDiagram(targetExtension) {
    if (!this.latestDiagram) return;

    let blob = undefined;
    if (targetExtension === 'bpmn' && this.latestDiagramAsBpmn) {
      blob = new Blob([this.latestDiagramAsBpmn], {
        type: 'application/xml;charset=utf-8',
      });
    } else if (targetExtension === 'svg' && this.latestDiagramAsSvg) {
      blob = new Blob([this.latestDiagramAsSvg], {
        type: 'image/svg+xml;charset=utf-8',
      });
    } else if (targetExtension === 'pdf' && this.latestDiagramAsSvg) {
      blob = yield convertSvgToPdf(this.latestDiagramAsSvg);
    } else if (targetExtension === 'png' && this.latestDiagramAsSvg) {
      blob = yield convertSvgToPng(this.latestDiagramAsSvg);
    }
    if (!blob) return;

    const fileName = `${removeFileNameExtension(
      this.latestDiagram.name,
      this.latestDiagram.extension
    )}.${targetExtension}`;

    FileSaver.saveAs(blob, fileName);

    this.trackDownloadFileEvent(
      this.latestDiagram.id,
      this.latestDiagram.name,
      'bpmn',
      targetExtension
    );
  }

  trackDownloadFileEvent(fileId, fileName, fileExtension, targetExtension) {
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

  @dropTask
  *downloadAttachments() {
    if (!this.attachments) return;

    if (this.attachments.length === 1)
      yield this.downloadOriginalFile(this.attachments[0]);
    else
      yield downloadFilesAsZip(
        this.attachments,
        this.process?.title ? `Bijlagen ${this.process.title}` : 'Bijlagen'
      );
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

  @enqueueTask
  *addFileToProcess(newFileId) {
    const newFile = yield this.store.findRecord('file', newFileId);

    this.process.files.push(newFile);
    this.process.modified = newFile.created;

    yield this.process.save();
  }

  @dropTask
  *extractBpmnElements(bpmnFileId) {
    yield fetch(`/bpmn?id=${bpmnFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @action
  diagramUploaded(uploadedFileId) {
    this.replaceModalOpened = false;
    this.pageProcessSteps = 0;
    this.fetchLatestDiagramById.perform(uploadedFileId);
  }

  @action
  attachmentsUploaded(_, queueInfo) {
    if (!queueInfo.isQueueEmpty) return;
    this.addModalOpened = false;
    this.fetchAttachments.perform();
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

  @action
  setProcessEmail(event) {
    if (!this.process) return;
    this.process.email = event.target.value;
    this.validateForm();
  }

  validateForm() {
    this.formIsValid =
      this.process?.validate() && this.process?.hasDirtyAttributes;
  }

  @action
  openDeleteModal(fileToDelete) {
    this.fileToDelete = fileToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeDeleteModal() {
    this.fileToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @dropTask
  *deleteFile() {
    if (!this.fileToDelete) return;

    this.fileToDelete.archive();

    try {
      yield this.fileToDelete.save();
      this.toaster.success('Bestand succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      this.toaster.error('Bestand kon niet worden verwijderd', 'Fout');
      this.fileToDelete.rollbackAttributes();
    }

    if (this.fileToDelete.isBpmnFile || this.fileToDelete.isVisioFile)
      this.fetchDiagrams.perform();
    else this.fetchAttachments.perform();

    this.closeDeleteModal();
  }

  reset() {
    this.resetModel();

    this.downloadModalOpened = false;
    this.replaceModalOpened = false;
    this.addModalOpened = false;
    this.deleteModalOpened = false;

    this.latestDiagramAsBpmn = undefined;
    this.latestDiagramAsSvg = undefined;

    this.attachments = undefined;
    this.diagrams = undefined;
    this.processSteps = undefined;
    this.latestDiagram = undefined;
  }

  // Tasks

  @keepLatestTask
  *fetchLatestDiagram() {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    const query = {
      reload: true,
      page: {
        number: 0,
        size: 1,
      },
      'filter[processes][id]': this.model.processId,
      'filter[:or:][extension]': ['bpmn', 'vsdx'],
      sort: '-created',
    };

    let diagrams;
    try {
      diagrams = yield this.store.query('file', query);
      console.log(diagrams);
    } catch {
      console.log('error');
      this.latestDiagramHasErrored = true;
    }
    if (diagrams?.length) this.latestDiagram = diagrams[0];
    else this.latestDiagramHasErrored = true;

    this.latestDiagramIsLoading = false;
  }

  @keepLatestTask
  *fetchLatestDiagramById(fileId) {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      this.latestDiagram = yield this.store.findRecord('file', fileId, {
        reload: true,
      });
    } catch {
      this.latestDiagramHasErrored = true;
    }

    this.latestDiagramIsLoading = false;
  }

  @keepLatestTask({
    observes: ['latestDiagram', 'pageProcessSteps', 'sortProcessSteps'],
  })
  *fetchProcessSteps() {
    this.processStepsAreLoading = true;
    this.processStepsHaveErrored = false;

    if (this.latestDiagramHasErrored) {
      this.processStepsHaveErrored = true;
      this.processStepsAreLoading = false;
      return;
    }

    const latestDiagramId = this.latestDiagram?.id;
    if (!latestDiagramId) return;

    try {
      while (true) {
        const query = {
          'filter[:exact:resource]': `http://mu.semte.ch/services/file-service/files/${latestDiagramId}`,
          sort: '-modified',
        };
        const jobs = yield this.store.query('job', query);

        if (jobs.length === 0) break;

        const jobStatus = jobs[0].status;
        if (jobStatus === ENV.jobStates.success) break;

        if (
          jobStatus === ENV.jobStates.failed ||
          jobStatus === ENV.jobStates.canceled
        )
          throw Error;

        yield timeout(1000);
      }
    } catch {
      this.processStepsHaveErrored = true;
      this.processStepsAreLoading = false;
      return;
    }

    const query = {
      page: {
        number: this.pageProcessSteps,
        size: this.sizeProcessSteps,
      },
      include: 'type',
      'filter[:has:name]': true,
      'filter[bpmn-process][bpmn-file][id]': latestDiagramId,
    };

    if (this.sortProcessSteps) {
      const isDescending = this.sortProcessSteps.startsWith('-');

      let fieldName = isDescending
        ? this.sortProcessSteps.substring(1)
        : this.sortProcessSteps;
      if (fieldName === 'type') fieldName = 'type.label';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    try {
      this.processSteps = yield this.store.query('bpmn-element', query);
    } catch {
      this.processStepsHaveErrored = true;
    }

    this.processStepsAreLoading = false;
  }

  @keepLatestTask({
    observes: ['latestDiagram', 'pageVersions', 'sortVersions'],
  })
  *fetchDiagrams() {
    this.diagramsAreLoading = true;
    this.diagramsHaveErrored = false;

    const query = {
      reload: true,
      page: {
        number: this.pageVersions,
        size: this.sizeVersions,
      },
      'filter[processes][id]': this.model.processId,
      'filter[:or:][extension]': ['bpmn', 'vsdx'],
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (this.sortVersions) {
      const isDescending = this.sortVersions.startsWith('-');

      let sortValue = isDescending
        ? this.sortVersions.substring(1)
        : this.sortVersions;

      if (sortValue === 'name') sortValue = `:no-case:${sortValue}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    try {
      this.diagrams = yield this.store.query('file', query);
    } catch {
      this.diagramsHaveErrored = true;
    }

    this.diagramsAreLoading = false;
  }

  @keepLatestTask({ observes: ['pageAttachments', 'sortAttachments'] })
  *fetchAttachments() {
    this.attachmentsAreLoading = true;
    this.attachmentsHaveErrored = false;

    const query = {
      reload: true,
      page: {
        number: this.pageAttachments,
        size: this.sizeAttachments,
      },
      'filter[processes][id]': this.model.processId,
      'filter[:not:extension]': ['bpmn', 'vsdx'],
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (this.sortAttachments) {
      const isDescending = this.sortAttachments.startsWith('-');

      let sortValue = isDescending
        ? this.sortAttachments.substring(1)
        : this.sortAttachments;

      if (
        sortValue === 'name' ||
        sortValue === 'extension' ||
        sortValue === 'format'
      )
        sortValue = `:no-case:${sortValue}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    try {
      this.attachments = yield this.store.query('file', query);
    } catch {
      this.attachmentsHaveErrored = true;
    }

    this.attachmentsAreLoading = false;
  }
}
