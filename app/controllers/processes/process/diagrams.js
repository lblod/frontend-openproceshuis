import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProcessesProcessDiagramsController extends Controller {
  @tracked selectedDiagramList;
  @tracked selectedMainDiagramFile;

  @action
  openDiagramList(diagramList) {
    this.selectedDiagramList = diagramList;
    const diagram = diagramList.diagrams[0];
    this.selectedMainDiagramFile = diagram?.diagramFile;
  }

  @action
  isDiagramListSelected(diagramListId) {
    return this.selectedDiagramList?.id === diagramListId;
  }
}
