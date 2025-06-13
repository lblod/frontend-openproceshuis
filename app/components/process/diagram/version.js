import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { keepLatestTask, dropTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';
import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';

export default class ProcessDiagramVersion extends Component {
  @service store;
  @service diagram;
  @service toaster;
  @tracked pageVersions = 0;
  @tracked sortVersions = '-created';
  sizeVersions = 10;
  @tracked diagrams = undefined;
  @tracked diagramsAreLoading = true;
  @tracked diagramsHaveErrored = false;
  @tracked deleteModalOpened = false;

  constructor() {
    super(...arguments);
    this.fetchDiagrams.perform();
  }

  get process() {
    return this.args.process;
  }

  get latestDiagram() {
    return this.diagram.latestDiagram;
  }

  get diagramsHaveNoResults() {
    return (
      !this.diagramsAreLoading &&
      !this.diagramsHaveErrored &&
      this.diagrams?.length === 0
    );
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

  @keepLatestTask({
    observes: ['latestDiagram', 'pageVersions', 'sortVersions'],
  })
  *fetchDiagrams() {
    this.diagramsAreLoading = true;
    this.diagramsHaveErrored = false;

    const query = {
      reload: true,
      page: {
        number: this.pageVersions,
        size: this.sizeVersions,
      },
      'filter[processes][id]': this.process.id,
      'filter[:or:][extension]': ['bpmn', 'vsdx'],
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (this.sortVersions) {
      const isDescending = this.sortVersions.startsWith('-');

      let sortValue = isDescending
        ? this.sortVersions.substring(1)
        : this.sortVersions;

      if (sortValue === 'name') sortValue = `:no-case:${sortValue}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    try {
      this.diagrams = yield this.store.query('file', query);
    } catch {
      this.diagramsHaveErrored = true;
    }

    this.diagramsAreLoading = false;
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

    if (this.fileToDelete.isBpmnFile || this.fileToDelete.isVisioFile)
      this.fetchDiagrams.perform();
    else this.fetchAttachments.perform();

    this.closeDeleteModal();
  }
}
