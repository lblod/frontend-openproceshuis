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

  async getDiagramListsWithFilesForProcess(processId) {
    const processWithLists = await this.store.query('process', {
      'filter[id]': processId,
      include:
        'diagram-lists,diagram-lists.diagrams,diagram-lists.diagrams.diagram-file',
      reload: true,
    });
    const diagramLists = Array.from(processWithLists[0]?.diagramLists);
    return diagramLists.filter((list) =>
      list.diagrams.some((d) => !d.diagramFile.isArchived),
    );
  }

  async getLatestDiagramList(processId) {
    const allDiagramLists =
      await this.getDiagramListsWithFilesForProcess(processId);
    const sortedOnCreatedLists = allDiagramLists.sort(
      (a, b) => new Date(b.created) - new Date(a.created),
    );
    return sortedOnCreatedLists[0];
  }

  getFirstFileOfList(list) {
    const sortedDiagrams = Array.from(list.diagrams).sort(
      (a, b) => a.position - b.position,
    );
    const diagrams = sortedDiagrams.filter(
      (diagram) =>
        (diagram.diagramFile.isBpmnFile || diagram.diagramFile.isVisioFile) &&
        diagram.diagramFile.status !== ENV.resourceStates.archived,
    );
    return diagrams[0].diagramFile;
  }

  fetchLatest = task({ keepLatest: true }, async (processId) => {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      const list = await this.getLatestDiagramList(processId);
      const latestDiagramFile = this.getFirstFileOfList(list);

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

  async createDiagramListForFiles(fileIds) {
    const files = await this.store.query('file', {
      'filter[id]': fileIds.join(','),
    });
    const now = new Date();
    const diagramListItems = files.map((file, index) => {
      return this.store.createRecord('diagram-list-item', {
        position: index + 1,
        created: now,
        modified: now,
        diagramFile: file,
        subItems: [],
      });
    });

    await Promise.all(diagramListItems.map(async (item) => await item.save()));
    const diagramList = this.store.createRecord('diagram-list', {
      created: now,
      modified: now,
      version: 'v0.0.1',
      diagrams: diagramListItems,
    });
    await diagramList.save();

    return diagramList;
  }
}
