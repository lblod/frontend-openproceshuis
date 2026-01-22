import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  downloadFileByUrl,
  downloadFilesAsZip,
} from 'frontend-openproceshuis/utils/file-downloader';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessAttachments extends Component {
  constructor() {
    super(...arguments);
    this.fetchAttachments.perform();
  }
  @service api;
  @service store;
  @service toaster;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;
  @tracked fileToDelete = undefined;

  get process() {
    return this.args.process;
  }

  @tracked pageAttachments = 0;
  @tracked sortAttachments = 'name';
  sizeAttachments = 10;

  @tracked attachments = undefined;
  @tracked attachmentsAreLoading = true;
  @tracked attachmentsHaveErrored = false;

  get attachmentsHaveNoResults() {
    return (
      !this.attachmentsAreLoading &&
      !this.attachmentsHaveErrored &&
      this.attachments?.length === 0
    );
  }

  @action
  openAddModal() {
    this.addModalOpened = true;
  }

  @action
  openDeleteModal(fileToDelete) {
    this.fileToDelete = fileToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeAddModal() {
    this.addModalOpened = false;
  }

  @action
  closeDeleteModal() {
    this.fileToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @action
  async downloadFile(file) {
    await downloadFileByUrl(file.id, file.name);
    this.args.trackDownloadFileEvent(file.id, file.name, file.extension);
  }

  addFileToProcess = task({ enqueue: true }, async (newFileId) => {
    const newFile = await this.store.findRecord('file', newFileId);
    this.process.files.push(newFile);
    this.process.modified = newFile.created;

    await this.process.save();
  });

  @action
  attachmentsUploaded(_, queueInfo) {
    if (!queueInfo.isQueueEmpty) return;
    this.addModalOpened = false;
    this.fetchAttachments.perform();
  }

  fetchAttachments = task(
    { keepLatest: true, observes: ['pageAttachments', 'sortAttachments'] },
    async () => {
      this.attachmentsAreLoading = true;
      this.attachmentsHaveErrored = false;

      const query = {
        reload: true,
        page: {
          number: this.pageAttachments,
          size: this.sizeAttachments,
        },
        'filter[:not:status]': ENV.resourceStates.archived,
      };

      if (this.sortAttachments) {
        const isDescending = this.sortAttachments.startsWith('-');

        let sortValue = isDescending
          ? this.sortAttachments.substring(1)
          : this.sortAttachments;

        if (sortValue === 'name' || sortValue === 'extension')
          sortValue = `:no-case:${sortValue}`;
        if (isDescending) sortValue = `-${sortValue}`;

        query.sort = sortValue;
      }

      try {
        this.attachments = await this.store.query('file', query);
      } catch {
        this.attachmentsHaveErrored = true;
      }
      this.attachmentsAreLoading = false;
    },
  );

  downloadAttachments = task({ drop: true }, async () => {
    if (!this.attachments) return;

    if (this.attachments.length === 1) this.downloadFile(this.attachments[0]);
    await downloadFilesAsZip(
      this.attachments,
      this.process?.title ? `Bijlagen ${this.process.title}` : 'Bijlagen',
    );
  });

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

    this.fetchAttachments.perform();

    this.closeDeleteModal();
  });
}
