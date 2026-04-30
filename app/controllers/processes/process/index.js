import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask, task, timeout } from 'ember-concurrency';
import { service } from '@ember/service';
import { toSafeString } from '../../../utils/string-manipulation';

export default class ProcessesProcessIndexController extends Controller {
  queryParams = [
    { versionedProcessId: { as: 'versionedProcess' } },
    'attachmentsPage',
    'attachmentsSize',
    'attachmentsSort',
    'diagramVersionsPage',
    'diagramVersionsSort',
    'diagramsPage',
    'diagramsSort',
  ];
  @tracked versionedProcessId = null;
  @tracked attachmentsPage = 0;
  @tracked attachmentsSize = 5;
  @tracked attachmentsSort = 'name';
  @tracked diagramVersionsPage = 0;
  @tracked diagramVersionsSort = '-created';
  @tracked diagramsPage = 0;
  @tracked diagramsSort = 'position';

  @service store;
  @service router;
  @service currentSession;
  @service toaster;
  @service api;
  @service diagram;
  @service eventTracking;

  @tracked versionedProcess = null;
  @tracked isEditingDetails = false;
  @tracked selectedDiagramFile;
  @tracked isWizardModalOpen;

  get process() {
    return this.model.process;
  }

  loadVersionedProcess = restartableTask(async (versionId) => {
    this.versionedProcess = versionId
      ? await this.store.findRecord('versioned-process', versionId, {
          include: ['ipdc-products'].join(','),
        })
      : null;
  });

  get canEdit() {
    return (
      this.isPublisherOfProcess ||
      (this.process.isPublishedByAbbOrDv && this.currentSession.isAbbOrDv)
    );
  }

  get isPublisherOfProcess() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.model.process?.publisher &&
      this.model.process.publisher.id === this.currentSession.group.id
    );
  }

  @action
  onProcessVersionSelected(processOrVersioned) {
    if (processOrVersioned?.isVersionedResource) {
      this.versionedProcessId = processOrVersioned.id;
      this.loadVersionedProcess.perform(processOrVersioned.id);
    } else {
      this.versionedProcessId = null;
      this.loadVersionedProcess.perform(null);
    }
  }

  @action
  async openDiagramFile(diagramFile) {
    if (diagramFile) {
      this.selectedDiagramFile = null;
      await timeout(25); // NOTE - so bad
      this.selectedDiagramFile = diagramFile;
    } else {
      await this.openDiagramList(this.selectedDiagramList);
    }
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

    this.isWizardModalOpen = false;
    this.loadVersionedProcess.cancelAll();
    this.versionedProcess = null;

    this.attachmentsPage = 0;
    this.diagramVersionsPage = 0;
    this.diagramsPage = 0;

    this.selectedDiagramFile = this.diagram.getFirstFileOfList(
      this.model.diagramList,
    );
  }

  @action
  copyUrl() {
    try {
      const baseUrl = window.location.origin;
      navigator.clipboard.writeText(
        `${baseUrl}/processen/${this.model.process.id}`,
      );
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
  fetchDiagramVersions() {
    this.diagramVersionsPage = 0;
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
    if (this.model.process.title) {
      return `${toSafeString(this.model.process?.title)}`;
    }

    return 'proces_diagrammen';
  }
  downloadDiagrams = task({ drop: true }, async () => {
    const diagramFiles = this.model.diagramList?.diagrams
      ?.filter((diagrams) => !diagrams.diagramFile.isArchived)
      ?.map((diagram) => diagram.diagramFile);

    if (!diagramFiles) {
      this.toaster.error('Er werden geen diagrammen gevonden', undefined, {
        timeOut: 5000,
      });
      return;
    }
  });

  get diagramsRouteNameFromParent() {
    if (!this.model.breadcrumRouteName) {
      return 'processes.process.diagrams';
    }
    return this.model.breadcrumRouteName + '.diagrams';
  }
}
