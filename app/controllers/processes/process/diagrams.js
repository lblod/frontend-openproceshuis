import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { task, timeout } from 'ember-concurrency';

export default class ProcessesProcessDiagramsController extends Controller {
  @service currentSession;
  @service router;
  @service diagram;
  @service api;
  @service toaster;

  @tracked isCreateModalOpen = false;

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
    if (!diagramFile) {
      await this.openDiagramList(this.selectedDiagramList);
    } else {
      this.selectedDiagramFile = diagramFile;
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
    const diagramList =
      await this.diagram.createDiagramListForFiles(newFileIds);
    const currentLists = await this.model.process.diagramLists;
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
}
