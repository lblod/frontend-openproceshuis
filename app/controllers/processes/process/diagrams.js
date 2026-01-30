import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProcessesProcessDiagramsController extends Controller {
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
}
