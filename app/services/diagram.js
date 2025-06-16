import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';
import { action } from '@ember/object';

export default class DiagramService extends Service {
  @service store;

  @tracked latestDiagram;
  @tracked latestDiagramIsLoading = true;
  @tracked latestDiagramHasErrored = false;

  @action
  openDownloadModal() {
    this.downloadModalOpened = true;
  }

  @action
  closeDownloadModal() {
    this.downloadModalOpened = false;
  }

  @keepLatestTask
  *fetchLatest(processId) {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    const query = {
      reload: true,
      page: {
        number: 0,
        size: 1,
      },
      'filter[processes][id]': processId,
      'filter[:or:][extension]': ['bpmn', 'vsdx'],
      sort: '-created',
    };

    try {
      const diagrams = yield this.store.query('file', query);
      this.latestDiagram = diagrams?.[0]; // may be undefined if none
    } catch (e) {
      this.latestDiagramHasErrored = true;
    } finally {
      this.latestDiagramIsLoading = false; // always clear the spinner
    }
  }

  @keepLatestTask
  *fetchLatestById(fileId) {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      this.latestDiagram = yield this.store.findRecord('file', fileId, {
        reload: true,
      });
    } catch {
      this.latestDiagramHasErrored = true;
    }

    this.latestDiagramIsLoading = false;
  }
}
