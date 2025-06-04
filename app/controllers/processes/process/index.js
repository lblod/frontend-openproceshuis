import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, enqueueTask, keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';
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
  @service api;

  @tracked downloadModalOpened = false;
  @tracked replaceModalOpened = false;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;

  @tracked isEditingDetails = false;
  @tracked fileToDelete = undefined;

  // Process

  get process() {
    return this.model.process;
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
      (this.process.publisher.id === this.currentSession.group.id ||
        (this.process.isPublishedByAbbOrDv && this.currentSession.isAbbOrDv))
    );
  }

  @action
  setIsEditingDetails(value) {
    this.isEditingDetails = value;
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
    try {
      if (!this.latestDiagram) throw Error;

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
            targetExtension,
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
            targetExtension,
          );
          const response = yield fetch(url);
          if (!response.ok) throw Error(response.status);
          blob = yield response.blob();
        }
      } else if (targetExtension === 'png' && this.latestDiagramAsSvg) {
        blob = yield convertSvgToPng(this.latestDiagramAsSvg);
      }
      if (!blob) throw Error;

      const fileName = `${removeFileNameExtension(
        this.latestDiagram.name,
        this.latestDiagram.extension,
      )}.${targetExtension}`;

      FileSaver.saveAs(blob, fileName);
    } catch {
      let message = 'Bestand kon niet worden opgehaald';

      if (this.latestDiagram.isVisioFile && targetExtension === 'bpmn') {
        const mailto =
          'mailto:loketlokaalbestuur@vlaanderen.be' +
          `?subject=${encodeURIComponent(
            'Visio kan niet downloaden als BPMN',
          )}` +
          `?body=${encodeURIComponent(`\n\n${window.location.href}\n`)}`;
        const linkHtml = `<a href="${mailto}">Stuur ons een mailtje</a>`;
        message = htmlSafe(
          `Dit visio-bestand kan niet worden gedownload als BPMN. ${linkHtml} met het proces waarover het gaat en een korte beschrijving van wat niet lukt. Dan kunnen we nagaan wat fout gaat en Open Proces Huis verder verbeteren.`,
        );
      }

      this.toaster.error(message, 'Fout');
      return;
    }

    this.trackDownloadFileEvent(
      this.latestDiagram.id,
      this.latestDiagram.name,
      'bpmn',
      targetExtension,
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
        error,
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
        this.process?.title ? `Bijlagen ${this.process.title}` : 'Bijlagen',
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
    yield this.api.fetch(`/bpmn?id=${bpmnFileId}`, {
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
    this.process?.rollbackAttributes();

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
      'filter[processes][id]': this.model.process.id,
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
      'filter[processes][id]': this.model.process.id,
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
      'filter[processes][id]': this.model.process.id,
      'filter[:not:extension]': ['bpmn', 'vsdx'],
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (this.sortAttachments) {
      const isDescending = this.sortAttachments.startsWith('-');

      let sortValue = isDescending
        ? this.sortAttachments.substring(1)
        : this.sortAttachments;

      if (sortValue === 'name' || sortValue === 'extension')
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
