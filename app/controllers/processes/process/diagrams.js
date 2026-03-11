import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { task, timeout } from 'ember-concurrency';
import { toSafeString } from '../../../utils/string-manipulation';

export default class ProcessesProcessDiagramsController extends Controller {
  @service currentSession;
  @service router;
  @service diagram;
  @service api;
  @service toaster;
  @service eventTracking;

  @tracked isCreateModalOpen = false;
  @tracked isDeleteVersionModalOpen = false;

  @tracked selectedDiagramList;
  @tracked selectedDiagramFile;

  @action
  async openDiagramList(diagramList) {
    this.selectedDiagramFile = null;
    await timeout(25); // NOTE - so bad
    this.selectedDiagramList = diagramList;
    const firstOfSortedDiagramFiles =
      this.diagram.getFirstFileOfList(diagramList);
    this.selectedDiagramFile = firstOfSortedDiagramFiles;
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
  isDiagramListSelected(diagramListId) {
    return this.selectedDiagramList?.id === diagramListId;
  }

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.model.process?.publisher &&
      (this.model.process.publisher.id === this.currentSession.group.id ||
        (this.model.process.isPublishedByAbbOrDv &&
          this.currentSession.isAbbOrDv))
    );
  }

  get canEditFilesInTable() {
    return (
      this.canEdit &&
      this.selectedDiagramList.id === this.model.activeDiagramList.id
    );
  }

  @action
  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  addFileToProcess = task({ enqueue: true }, async (newFileIds) => {
    const currentLists = await this.model.process.diagramLists;
    const diagramList = await this.diagram.createDiagramListForFiles(
      newFileIds,
      currentLists,
    );
    this.model.process.diagramLists = [...currentLists, diagramList];
    await this.model.process.save();
  });

  extractBpmnElements = task({ drop: true }, async (bpmnFileId) => {
    await this.api.fetch(`/bpmn?id=${bpmnFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  });

  @action
  diagramUploaded() {
    this.isCreateModalOpen = false;
    this.toaster.success('Nieuwe versie werd aangemaakt', null, {
      timeOut: 2500,
    });
    this.router.refresh();
  }

  @action
  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  @action
  goToProcessDetailPage() {
    this.router.transitionTo(
      this.model.breadcrumRouteName,
      this.model.process.id,
    );
  }

  deleteVersion = task({ drop: true }, async () => {
    try {
      const listItems = this.selectedDiagramList.diagrams;

      await Promise.all([
        ...listItems.map((item) => item.destroyRecord()),
        this.selectedDiagramList.destroyRecord(),
      ]);
      this.toaster.success('Diagram versie verwijderd', null, {
        timeOut: 2500,
      });
      this.router.refresh();
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de diagram versie',
        undefined,
        {
          timeOut: 5000,
        },
      );
    } finally {
      this.isDeleteVersionModalOpen = false;
    }
  });

  get deleteVersionModalTitle() {
    const version = this.selectedDiagramList.version ?? '';
    return `diagram versie ${version}`;
  }

  @action
  onDiagramsDownloadedAsZip() {
    for (const file of this.diagramFiles) {
      this.eventTracking.trackDownloadFileEvent(
        file.id,
        file.name,
        file.extension,
        file.extension,
        this.model.process,
      );
      this.eventTracking.incrementFileDownloads.perform(
        file.extension,
        this.model.process.id,
      );
    }
  }

  get diagramFiles() {
    return this.diagram.getAvailableFilesFromList(this.selectedDiagramList);
  }

  get diagramsDownloadFolderName() {
    let listVersion = '';
    if (this.selectedDiagramList?.version) {
      listVersion = `${this.selectedDiagramList?.version}_`;
    }
    if (this.model.process.title) {
      return `${listVersion}${toSafeString(this.model.process?.title)}`;
    }

    return 'proces_diagrammen_versie';
  }
  downloadDiagrams = task({ drop: true }, async () => {
    const diagramFiles = this.selectedDiagramList?.diagrams
      ?.filter((diagrams) => !diagrams.diagramFile.isArchived)
      ?.map((diagram) => diagram.diagramFile);

    if (!diagramFiles) {
      this.toaster.error('Er werden geen diagrammen gevonden', undefined, {
        timeOut: 5000,
      });
      return;
    }
  });
}
