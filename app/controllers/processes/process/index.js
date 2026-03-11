import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ProcessesProcessIndexController extends Controller {
  queryParams = ['attachmentsPage', 'attachmentsSize', 'attachmentsSort'];
  @tracked attachmentsPage = 0;
  @tracked attachmentsSize = 10;
  @tracked attachmentsSort = 'name';

  @service store;
  @service router;
  @service currentSession;
  @service toaster;
  @service api;
  @service diagram;
  @service eventTracking;

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
    this.eventTracking.trackDownloadFileEvent(
      fileId,
      fileName,
      fileExtension,
      targetExtension,
      this.model.process,
    );
    this.eventTracking.incrementFileDownloads.perform(
      targetExtension,
      this.model.process.id,
    );
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

  @action
  fetchAttachments() {
    this.attachmentsPage = 0;
  }

  @action
  onDiagramsDownloadedAsZip() {
    for (const file of this.diagramFiles) {
      this.trackDownloadFileEvent(
        file.id,
        file.name,
        file.extension,
        file.extension,
      );
    }
  }

  get diagramFiles() {
    return this.diagram.getAvailableFilesFromList(this.model.diagramList);
  }

  get diagramsDownloadFolderName() {
    const safeProcessTitle = this.model.process?.title?.replace(
      /[^a-zA-Z0-9]/g,
      '',
    );
    if (this.model.process.title) {
      return `diagrammen-${safeProcessTitle}`;
    }

    return 'proces-diagrammen';
  }

  get diagramsRouteNameFromParent() {
    if (!this.model.breadcrumRouteName) {
      return 'processes.process.diagrams';
    }
    return this.model.breadcrumRouteName + '.diagrams';
  }
}
