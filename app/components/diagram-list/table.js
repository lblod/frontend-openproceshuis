import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';
import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class DiagramListTable extends Component {
  @service toaster;
  @service store;
  @service plausible;
  @service eventTracking;

  @tracked fileToDownload;
  @tracked fileToDelete;
  @tracked canDeleteFile = true;

  get hasNoResults() {
    return this.fetchDiagrams?.value?.length === 0;
  }

  @action
  async downloadFile(file) {
    await downloadFileByUrl(file.id, file.name);
  }

  @action
  onFileDownloadedSuccessful(fileModel, targetExtension) {
    this.fileToDelete = null;
    this.eventTracking.trackDownloadFileEvent(
      fileModel.id,
      fileModel.name,
      fileModel.extension,
      targetExtension,
      this.args.process,
    );
    this.eventTracking.incrementFileDownloads.perform(
      targetExtension,
      this.args.process?.id,
    );
  }

  fetchDiagrams = task({ restartable: true }, async () => {
    const diagramsInList = this.args.diagramList.diagrams;

    if (diagramsInList?.length === 0) {
      return [];
    }

    const diagrams = await this.store.query('diagram-list-item', {
      sort: this.args.sort,
      'filter[id]': diagramsInList.map((diagram) => diagram.id).join(','),
      'filter[diagram-file][:not:status]': ARCHIVED_STATUS_URI,
    });

    return diagrams;
  });

  diagrams = trackedTask(this, this.fetchDiagrams, () => [
    this.args.process,
    this.args.sort,
  ]);
}
