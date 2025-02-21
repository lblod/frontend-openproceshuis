import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, enqueueTask, keepLatestTask } from 'ember-concurrency';
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
import generateFileDownloadUrl, {
  generateVisioConversionUrl,
} from 'frontend-openproceshuis/utils/file-download-url';

export default class ProcessesProcessIndexController extends Controller {
  queryParams = [
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
  @tracked draftIpdcProducts = undefined;

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
    console.log('latest diagram:', this.latestDiagram);
    console.log('target extension:', targetExtension);
    if (!this.latestDiagram) return;

    let blob = undefined;
    if (targetExtension === 'vsdx' && this.latestDiagram.isVisioFile) {
      const url = generateFileDownloadUrl(this.latestDiagram.id);
      const response = yield fetch(url);
      if (!response.ok) throw Error(response.status);
      blob = yield response.blob();
    } else if (targetExtension === 'bpmn') {
      if (this.latestDiagramAsBpmn) {
        blob = new Blob([this.latestDiagramAsBpmn], {
          type: 'application/xml;charset=utf-8',
        });
      } else if (this.latestDiagram.isVisioFile) {
        const url = generateVisioConversionUrl(
          this.latestDiagram.id,
          targetExtension
        );
        const response = yield fetch(url);
        if (!response.ok) throw Error(response.status);
        blob = yield response.blob();
      }
    } else if (targetExtension === 'svg' && this.latestDiagramAsSvg) {
      blob = new Blob([this.latestDiagramAsSvg], {
        type: 'image/svg+xml;charset=utf-8',
      });
    } else if (targetExtension === 'pdf') {
      if (this.latestDiagramAsSvg) {
        blob = yield convertSvgToPdf(this.latestDiagramAsSvg);
      } else if (this.latestDiagram.isVisioFile) {
        const url = generateVisioConversionUrl(
          this.latestDiagram.id,
          targetExtension
        );
        const response = yield fetch(url);
        if (!response.ok) throw Error(response.status);
        blob = yield response.blob();
      }
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
    try {
      this.loadFileDownloads.perform(targetExtension);
    } catch (error) {
      console.error(
        `Something went wrong while trying to fetch the download quantity of ${targetExtension} `,
        error
      );
    }
  }

  @enqueueTask
  *loadFileDownloads(targetExtension) {
    const process = yield this.store.findRecord('process', this.process.id);
    const stats = process.processStatistics;

    switch (targetExtension) {
      case 'bpmn':
        stats.bpmnDownloads += 1;
        break;
      case 'pdf':
        stats.pdfDownloads += 1;
        break;
      case 'png':
        stats.pngDownloads += 1;
        break;
      case 'svg':
        stats.svgDownloads += 1;
        break;
      default:
        console.error('fileExtension', targetExtension, 'not recognized');
        return;
    }
    yield stats.save();
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
    this.draftIpdcProducts = this.process?.ipdcProducts;
    this.edit = !this.edit;
    this.validateForm();
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (!this.process) return;

    if (this.formIsValid) {
      console.log('this.process', this.process);
      this.process.modified = new Date();

      try {
        this.process.ipdcProducts = yield Promise.all(
          this.draftIpdcProducts.map(async (product) => {
            if (product.isDraft) {
              const existingProducts = await this.store.query(product.type, {
                filter: { 'product-number': product.productNumber },
              });
              if (existingProducts.length) return existingProducts[0];

              const newProduct = this.store.createRecord(product.type, {
                name: product.name,
                productNumber: product.productNumber,
              });
              await newProduct.save();
              return newProduct;
            }
            return product;
          })
        );

        // yield this.process.save();

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
    this.draftIpdcProducts = this.process?.ipdcProducts;
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

  @action
  setDraftIpdcProducts(event) {
    const productNumbers = event.map((product) => product.productNumber);
    const hasDuplicates =
      new Set(productNumbers).size !== productNumbers.length;
    if (hasDuplicates) return;

    this.draftIpdcProducts = event;
    this.validateForm();
  }

  validateForm() {
    this.formIsValid =
      this.process?.validate() &&
      (this.process?.hasDirtyAttributes ||
        this.draftIpdcProducts?.length < this.process?.ipdcProducts?.length ||
        this.draftIpdcProducts?.some((product) => product.isDraft));
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
  c;

  @action
  toggleBlueprintStatus(event) {
    this.process.isBlueprint = event;
    console.log('this.process.isBlueprint', this.process.isBlueprint);
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
    } catch {
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
