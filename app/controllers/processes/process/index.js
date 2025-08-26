import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { enqueueTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';

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

  @tracked isEditingDetails = false;

  get process() {
    return this.model.process;
  }

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
      this.incrementFileDownloads.perform(targetExtension);
    } catch (error) {
      console.error(
        `Something went wrong while trying to fetch the download quantity of ${targetExtension} `,
        error,
      );
    }
  }

  @enqueueTask
  *incrementFileDownloads(targetExtension) {
    try {
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
    } catch (error) {
      console.error(
        `Something went wrong while loading the file downloads:`,
        error,
      );
    }
  }

  reset() {
    this.process?.rollbackAttributes();

    this.downloadModalOpened = false;
    this.replaceModalOpened = false;
    this.addModalOpened = false;
    this.deleteModalOpened = false;

    this.latestDiagramAsBpmn = undefined;
    this.latestDiagramAsSvg = undefined;

    this.diagrams = undefined;
    this.latestDiagram = undefined;
  }

  @action
  copyUrl() {
    try {
      navigator.clipboard.writeText(window.location.href);
      this.toaster.success('Link naar proces gekopieerd', undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het kopiëren van de link naar het proces',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  }
}
