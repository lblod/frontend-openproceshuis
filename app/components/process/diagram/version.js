import Component from '@glimmer/component';

import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessDiagramVersion extends Component {
  @service store;
  @service diagram;
  @service toaster;

  @tracked deleteModalOpened = false;

  constructor() {
    super(...arguments);
    this.diagram.fetchVersions.perform(this.process.id);
  }

  get process() {
    return this.args.process;
  }

  get latestDiagram() {
    return this.diagram.latestDiagram;
  }

  get diagrams() {
    return this.diagram.diagrams;
  }

  get sizeVersions() {
    return this.diagram.sizeVersions;
  }

  get diagramsAreLoading() {
    return this.diagram.diagramsAreLoading;
  }

  get diagramsHaveErrored() {
    return this.diagram.diagramsHaveErrored;
  }

  get diagramsHaveNoResults() {
    return this.diagram.diagramsHaveNoResults;
  }

  get pageVersions() {
    return this.diagram.pageVersions;
  }

  get sortVersions() {
    return this.diagram.sortVersions;
  }

  @action
  openDeleteModal(fileToDelete) {
    this.diagramListToDelete = fileToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeDeleteModal() {
    this.diagramListToDelete = undefined;
    this.deleteModalOpened = false;
  }

  deleteDiagramList = task({ drop: true }, async () => {
    if (!this.diagramListToDelete) return;

    this.diagramListToDelete.archive();

    try {
      await this.diagramListToDelete.save();
      this.toaster.success(
        'Diagrammen versie succesvol verwijderd',
        'Gelukt!',
        {
          timeOut: 5000,
        },
      );
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.fileDeletionError');
      this.toaster.error(errorMessage, 'Fout');
      this.diagramListToDelete.rollbackAttributes();
    }

    this.diagram.refreshVersions(this.process.id);

    this.closeDeleteModal();
  });
}
