import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { enqueueTask, keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

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

  @tracked isEditingDetails = false;

  // Process

  get process() {
    return this.model.process;
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
}
