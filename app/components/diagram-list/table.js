import Component from '@glimmer/component';

import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class DiagramListTable extends Component {
  @service toaster;
  page = 0;
  size = 5;
  sort = '-created';

  @tracked fileToDelete;
  @tracked isDeleteModalOpen;

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
  openDeleteModal(fileToDelete) {
    this.fileToDelete = fileToDelete;
    this.isDeleteModalOpen = true;
  }

  @action
  closeDeleteModal() {
    this.fileToDelete = undefined;
    this.isDeleteModalOpen = false;
  }

  deleteFile = task({ drop: true }, async () => {
    if (!this.fileToDelete) return;

    this.fileToDelete.archive();

    try {
      await this.fileToDelete.save();
      this.toaster.success('Bestand succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.fileDeletionError');
      this.toaster.error(errorMessage, 'Fout');
      this.fileToDelete.rollbackAttributes();
    }

    this.closeDeleteModal();
  });
}
