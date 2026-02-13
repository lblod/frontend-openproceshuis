import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';

export default class DiagramListTable extends Component {
  @service toaster;
  @service store;
  @service plausible;
  @service eventTracking;

  @tracked fileToDownload;
  @tracked fileToDelete;
  @tracked canDeleteFile = true;

  get activeDiagrams() {
    const diagrams = this.args.diagramList.diagrams;
    return diagrams
      .filter((diagrams) => !diagrams.diagramFile.isArchived)
      .sort((latest, current) => latest.position - current.position);
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
}
