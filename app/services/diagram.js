import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';
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

  async getDiagramListsFilesForProcessId(processId) {
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

    return filesOfLists;
  }

  fetchLatest = task({ keepLatest: true }, async (processId) => {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      const files = await this.getDiagramListsFilesForProcessId(processId);
      const latestDiagramFile = files.reduce((latest, current) => {
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

  fetchLatestById = task({ keepLatest: true }, async (fileId) => {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      this.latestDiagram = await this.store.findRecord('file', fileId, {
        reload: true,
      });
    } catch {
      this.latestDiagramHasErrored = true;
    }

    this.latestDiagramIsLoading = false;
  });

  fetchVersions = task(
    {
      keepLatest: true,
      observes: ['pageVersions', 'sortVersions'],
    },
    async (processId) => {
      this.diagramsAreLoading = true;
      this.diagramsHaveErrored = false;

      try {
        this.diagrams = await this.getDiagramListsFilesForProcessId(processId);
      } catch {
        this.diagramsHaveErrored = true;
      }

      this.diagramsAreLoading = false;
    },
  );

  refreshVersions(processId) {
    this.fetchVersions.perform(processId);
  }

  async createDiagramListForFile(fileId) {
    const now = new Date();
    const file = await this.store.findRecord('file', fileId);
    const diagramListItem = this.store.createRecord('diagram-list-item', {
      position: 1,
      created: now,
      modified: now,
      diagramFile: file,
      subItems: [],
    });
    await diagramListItem.save();
    const diagramList = this.store.createRecord('diagram-list', {
      order: 1,
      created: now,
      modified: now,
      version: 'v0.0.1',
      diagrams: [diagramListItem],
    });
    await diagramList.save();

    return diagramList;
  }
}
