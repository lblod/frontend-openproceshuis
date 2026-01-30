import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class ProcessesProcessDiagramsController extends Controller {
  @service currentSession;
  @tracked selectedDiagramList;

  @action
  openDiagramList(diagramList) {
    this.selectedDiagramList = diagramList;
  }

  @action
  isDiagramListSelected(diagramListId) {
    return this.selectedDiagramList?.id === diagramListId;
  }

  get showcasedMainDiagramFile() {
    return this.selectedDiagramList?.diagrams[0]?.diagramFile;
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
}
