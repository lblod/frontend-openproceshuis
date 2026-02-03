import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class ProcessesProcessDiagramsController extends Controller {
  @service currentSession;
  @service router;
  @tracked selectedDiagramList;
  @tracked selectedDiagramFile;

  @action
  async openDiagramList(diagramList) {
    this.selectedDiagramList = diagramList;
    const latestDiagrams = await diagramList.diagrams;
    this.selectedDiagramFile = latestDiagrams[0]?.diagramFile;
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
}
