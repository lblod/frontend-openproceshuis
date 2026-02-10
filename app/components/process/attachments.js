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

  pageAttachments = 0;
  sortAttachments = 'name';
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

  addFilesToProcess = task({ enqueue: true }, async (newFileIds) => {
    const newFiles = await this.store.query('file', {
      'filter[id]': newFileIds.join(','),
    });
    const currentAttachments = await this.process.attachments;
    this.process.attachments = [...currentAttachments, ...newFiles];
    await this.process.save();
  });

  @action
  attachmentsUploaded() {
    this.addModalOpened = false;
    this.fetchAttachments.perform();
  }

  fetchAttachments = task(
    { keepLatest: true, observes: ['pageAttachments', 'sortAttachments'] },
    async () => {
      this.attachmentsAreLoading = true;
      this.attachmentsHaveErrored = false;

      try {
        const processes = await this.store.query('process', {
          'filter[id]': this.process.id,
          include: 'attachments',
          page: { size: 1 },
        });
        const process = processes[0];
        const processFileIds = process?.attachments.map((file) => file.id);
        let files = [];
        if (processFileIds.length >= 1) {
          files = await this.store.query('file', {
            reload: true,
            page: {
              number: this.pageAttachments,
              size: this.sizeAttachments,
            },
            'filter[id]': processFileIds.join(','),
            'filter[:not:status]': ENV.resourceStates.archived,
            sort: this.sortAttachments,
          });
        }
        this.attachments = files;
      } catch {
        this.attachments = [];
        this.attachmentsHaveErrored = true;
      } finally {
        this.attachmentsAreLoading = false;
      }
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
