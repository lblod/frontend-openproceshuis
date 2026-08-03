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

  async getDiagramListsForProcess(processId) {
    const processesWithLists = await this.store.query('process', {
      'filter[id]': processId,
      include: 'diagram-lists',
      page: { number: 0, size: 1 },
      reload: true,
    });

    if (processesWithLists?.length === 0) {
      return [];
    }

    return Array.from(processesWithLists[0]?.diagramLists).filter(
      (_list) => !_list.isArchived,
    );
  }

  getAvailableFilesFromList(_listWithFiles, includeSubFiles = true) {
    if (!_listWithFiles) {
      return [];
    }
    const mainFiles =
      _listWithFiles?.diagrams
        ?.filter((diagram) => !diagram?.isArchived)
        ?.map((diagram) => diagram?.diagramFile) ?? [];

    if (!includeSubFiles) {
      return mainFiles;
    }

    const subFiles =
      _listWithFiles?.diagrams
        .filter((main) => !main?.isArchived)
        .flatMap((main) => main.subItems ?? [])
        .filter((sub) => !sub?.isArchived)
        .map((sub) => sub?.diagramFile) ?? [];

    return [...mainFiles, ...subFiles];
  }

  async fetchDiagramListWithDiagrams(_listId, _includeSubItems = false) {
    if (!_listId) {
      return null;
    }

    let included = ['diagrams', 'diagrams.diagram-file'];
    if (_includeSubItems) {
      included.push('diagrams.sub-items', 'diagrams.sub-items.diagram-file');
    }

    const query = {
      'filter[id]': _listId,
      include: included.join(','),
      page: { number: 0, size: 1 },
    };
    const lists = await this.store.query('diagram-list', query);

    return lists[0];
  }

  async getLatestDiagramList(_processId) {
    if (!_processId) {
      return null;
    }

    const allDiagramLists = await this.getDiagramListsForProcess(_processId);
    const sortedOnCreatedLists = allDiagramLists.sort(
      (a, b) => new Date(b.created) - new Date(a.created),
    );
    const diagramList = sortedOnCreatedLists[0];

    if (!diagramList) {
      return null;
    }

    return diagramList;
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
    return diagrams?.[0]?.diagramFile;
  }

  fetchLatest = task({ keepLatest: true }, async (processId) => {
    try {
      const list = await this.getLatestDiagramList(processId);

      return this.getFirstFileOfList(list);
    } catch (e) {
      console.log(e);
    }
  });

  async createDiagramListForFiles(fileModels, currentList = null) {
    const now = new Date();
    const diagramListItems = await Promise.all(
      fileModels.map(async (file, index) => {
        const diagramListItem = this.store.createRecord('diagram-list-item', {
          position: index + 1,
          created: now,
          modified: now,
          diagramFile: file,
          subItems: [],
        });
        await diagramListItem.save();
        return diagramListItem;
      }),
    );
    const diagramList = this.store.createRecord('diagram-list', {
      created: now,
      modified: now,
      version: `v0.0.${(currentList?.length ?? 0) + 1}`,
      diagrams: diagramListItems,
    });
    await diagramList.save();

    return diagramList;
  }

  async cloneDiagramList(_diagramList, _versionString, _diagrams = null) {
    const BATCH_SIZE = 4;
    const now = new Date();
    const newList = this.store.createRecord('diagram-list', {
      created: now,
      modified: now,
      version: _versionString,
      diagrams: [],
    });
    await newList.save();

    const sourceItems = Array.from(_diagrams ?? _diagramList.diagrams);
    for (let i = 0; i < sourceItems.length; i += BATCH_SIZE) {
      const batch = sourceItems.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((_listItem, batchIndex) =>
          this.cloneDiagramListItem(
            _listItem,
            _diagrams != null ? i + batchIndex + 1 : null,
          ),
        ),
      );
      newList.diagrams.push(...results.filter((item) => item !== null));
      await newList.save();
    }

    return newList;
  }

  async cloneDiagramListItem(_diagramListItem, _position = null) {
    if (_diagramListItem.isArchived) {
      return null;
    }

    const now = new Date();
    const newListItem = this.store.createRecord('diagram-list-item', {
      position: _position ?? _diagramListItem.position,
      created: now,
      modified: now,
      diagramFile: _diagramListItem.diagramFile,
      subItems: [],
    });
    await newListItem.save();

    const subItems = Array.from(_diagramListItem.subItems ?? []).filter(
      (_subItem) => !_subItem.isArchived,
    );
    if (subItems.length > 0) {
      const results = await Promise.all(
        subItems.map((_subItem) => this.cloneDiagramListItem(_subItem)),
      );

      newListItem.subItems.push(...results.filter((item) => item !== null));
      await newListItem.save();
    }

    return newListItem;
  }
}
