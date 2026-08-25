import Component from '@glimmer/component';

import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import { ARCHIVED_STATUS_URI } from '../../../utils/well-known-uris';

export default class ProcessDiagramVersion extends Component {
  @service store;
  @service diagram;
  @service toaster;

  @tracked versionsTableMeta = {};
  @tracked deleteModalOpened = false;
  @tracked openListId = null;

  size = 5;

  get hasNoResults() {
    return this.versions?.value?.length === 0;
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
      await Promise.all(
        this.diagramListToDelete.diagrams
          .filter((item) => !item.isArchived)
          .map((item) => {
            return item.archive();
          }),
      );
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

    this.args.reloadTableData?.();
    this.closeDeleteModal();
  });

  fetchVersions = task({ restartable: true }, async () => {
    const lists = await this.diagram.getDiagramListsForProcess(
      this.args.process.id,
    );
    const latestDiagramList = [...lists].sort(
      (a, b) => new Date(b.created) - new Date(a.created),
    )[0];
    const filteredLists = await this.getListsWithAppliedFilters(lists);
    this.versionsTableMeta = filteredLists.meta;

    const mappedListOfVersions = filteredLists.map(async (list) => {
      const listWithFiles = await this.diagram.fetchDiagramListWithDiagrams(
        list.id,
        true,
      );
      const firstFileInList = this.diagram.getFirstFileOfList(listWithFiles);
      const mainFileName = firstFileInList?.name;

      return {
        canRemove: latestDiagramList.id !== list.id,
        list,
        mainDiagramFileName: mainFileName ?? list.displayVersion,
        zipFilename: `${mainFileName}-${list.displayVersion}`,
        diagramFiles: this.diagram.getAvailableFilesFromList(listWithFiles),
      };
    });

    return await Promise.all(mappedListOfVersions);
  });

  async getListsWithAppliedFilters(diagramLists) {
    if (diagramLists?.length === 0) {
      return [];
    }

    const lists = await this.store.query('diagram-list', {
      sort: this.args.sort,
      page: {
        number: this.args.page,
        size: this.size,
      },
      'filter[id]': diagramLists.map((list) => list.id).join(','),
      'filter[:not:status]': ARCHIVED_STATUS_URI,
    });

    return lists;
  }

  versions = trackedTask(this, this.fetchVersions, () => [
    this.args.process,
    this.args.page,
    this.args.sort,
  ]);

  iconSubRowOpen = (listId) => {
    return this.openListId === listId ? 'nav-down' : 'nav-right';
  };

  get subRowButtonClass() {
    return this.args.hasSubItems ? '' : 'hidden-element';
  }

  @action
  openCloseSubRows(listId) {
    this.openListId = this.openListId === listId ? null : listId;
  }
}
