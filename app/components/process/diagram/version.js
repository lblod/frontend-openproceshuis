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
    const latestDiagramList = await this.diagram.getLatestDiagramList(
      this.args.process.id,
    );
    const lists = await this.diagram.getDiagramListsWithFilesForProcess(
      this.args.process.id,
    );
    const filteredLists = await this.getListsWithAppliedFilters(lists);
    this.versionsTableMeta = filteredLists.meta;

    const mappedListOfVersions = filteredLists.map(async (list) => {
      const firstFileInList = this.diagram.getFirstFileOfList(list);
      const mainFileName = firstFileInList?.name;

      return {
        canRemove: latestDiagramList.id !== list.id,
        list,
        mainDiagramFileName: mainFileName ?? list.displayVersion,
        zipFilename: `${mainFileName}-${list.displayVersion}`,
        diagramFiles: this.diagram.getAvailableFilesFromList(list),
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
}
