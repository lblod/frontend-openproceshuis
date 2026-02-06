import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class DiagramListDiagramsInTabs extends Component {
  @service diagram;
  @tracked selectedDiagramFile;

  constructor() {
    super(...arguments);
    this.selectFirstDiagramFile();
  }

  selectFirstDiagramFile() {
    const firstDiagramFile = this.diagram.getFirstFileOfList(
      this.args.diagramList,
    );
    this.selectedDiagramFile = firstDiagramFile;
  }

  @action
  selectDiagramFile(diagramFile) {
    if (diagramFile) {
      this.selectedDiagramFile = diagramFile;
    } else {
      this.selectFirstDiagramFile();
    }
  }

  get diagrams() {
    const diagrams = this.args.diagramList.diagrams;
    return diagrams
      .filter((diagrams) => !diagrams.diagramFile.isArchived)
      .sort((latest, current) => latest.position - current.position);
  }
}
