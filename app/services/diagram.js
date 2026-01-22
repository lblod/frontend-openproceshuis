import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';
import { action } from '@ember/object';
import ENV from 'frontend-openproceshuis/config/environment';

export default class DiagramService extends Service {
  @service store;

  @tracked latestDiagram;
  @tracked latestDiagramIsLoading = true;
  @tracked latestDiagramHasErrored = false;
  @tracked pageVersions = 0;
  @tracked sortVersions = '-created';
  sizeVersions = 10;
  @tracked diagrams = undefined;
  @tracked diagramsAreLoading = true;
  @tracked diagramsHaveErrored = false;

  currentProcessId = null;

  get diagramsHaveNoResults() {
    return (
      !this.diagramsAreLoading &&
      !this.diagramsHaveErrored &&
      this.diagrams?.length === 0
    );
  }

  @action
  openDownloadModal() {
    this.downloadModalOpened = true;
  }

  @action
  closeDownloadModal() {
    this.downloadModalOpened = false;
  }

  fetchLatest = task({ keepLatest: true }, async (processId) => {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      const processWithLists = await this.store.query('process', {
        'filter[id]': processId,
        include:
          'diagram-lists,diagram-lists.diagrams,diagram-lists.diagrams.diagram-file',
      });
      const diagramLists = processWithLists[0]?.diagramLists;
      const filesOfLists = diagramLists
        .map((list) => {
          return list.diagrams[0].diagramFile;
        })
        .filter(
          (file) =>
            (file.isBpmnFile || file.isVisioFile) &&
            file.status !== ENV.resourceStates.archived,
        );

      const latestDiagramFile = filesOfLists.reduce((latest, current) => {
        return current.modified > latest.modified ? current : latest;
      });

      this.latestDiagram = latestDiagramFile;
      return latestDiagramFile;
    } catch (e) {
      this.latestDiagramFile = null;
      this.latestDiagramHasErrored = true;
    } finally {
      this.latestDiagramIsLoading = false;
    }
  });

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

  @keepLatestTask({
    observes: ['pageVersions', 'sortVersions'],
  })
  *fetchVersions(processId) {
    this.diagramsAreLoading = true;
    this.diagramsHaveErrored = false;

    const query = {
      reload: true,
      page: {
        number: this.pageVersions,
        size: this.sizeVersions,
      },
      'filter[processes][id]': processId,
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

  refreshVersions(processId) {
    this.fetchVersions.perform(processId);
  }
}
