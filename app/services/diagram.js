import Service from '@ember/service';

import { service } from '@ember/service';
import { task } from 'ember-concurrency';
import { action } from '@ember/object';
import ENV from 'frontend-openproceshuis/config/environment';

export default class DiagramService extends Service {
  @service store;

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
    return diagramLists.filter((list) => {
      return (
        !list.isArchived && list.diagrams.some((d) => !d.diagramFile.isArchived)
      );
    });
  }

  getAvailableFilesFromList(listWithFiles) {
    return (
      listWithFiles?.diagrams
        ?.filter((diagrams) => !diagrams?.diagramFile?.isArchived)
        ?.map((diagram) => diagram?.diagramFile) ?? []
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
    if (!list) {
      return null;
    }

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
    try {
      const list = await this.getLatestDiagramList(processId);

      return this.getFirstFileOfList(list);
    } catch (e) {
      console.log(e);
    }
  });

  async createDiagramListForFiles(fileIds, currentList = null) {
    const now = new Date();
    const diagramListItems = [];
    for (let index = 0; index < fileIds.length; index++) {
      const fileId = fileIds[index];
      const file = await this.store.findRecord('file', fileId);
      const diagramListItem = this.store.createRecord('diagram-list-item', {
        position: index + 1,
        created: now,
        modified: now,
        diagramFile: file,
        subItems: [],
      });
      await diagramListItem.save();
      diagramListItems.push(diagramListItem);
    }
    const diagramList = this.store.createRecord('diagram-list', {
      created: now,
      modified: now,
      version: `v0.0.${(currentList?.length ?? 0) + 1}`,
      diagrams: diagramListItems,
    });
    await diagramList.save();

    return diagramList;
  }
}
