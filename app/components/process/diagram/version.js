import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dropTask } from 'ember-concurrency';
import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';

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
  async downloadFile(file) {
    await downloadFileByUrl(file.id, file.name);
    this.args.trackDownloadFileEvent(file.id, file.name, file.extension);
  }

  @action
  openDeleteModal(fileToDelete) {
    this.fileToDelete = fileToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeDeleteModal() {
    this.fileToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @dropTask
  *deleteFile() {
    if (!this.fileToDelete) return;

    this.fileToDelete.archive();

    try {
      yield this.fileToDelete.save();
      this.toaster.success('Bestand succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      this.toaster.error('Bestand kon niet worden verwijderd', 'Fout');
      this.fileToDelete.rollbackAttributes();
    }

    this.diagram.refreshVersions(this.process.id);

    this.closeDeleteModal();
  }
}
