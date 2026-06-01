import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';
import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class IcrAttachments extends Component {
  @service api;
  @service store;
  @service toaster;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;
  @tracked fileToDelete = undefined;

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

  addFilesToIcr = task({ enqueue: true }, async ([newFileId]) => {
    const newFile = await this.store.findRecord('file', newFileId);
    this.args.informationAsset.attachments.push(newFile);
    this.args.informationAsset.modified = newFile.created;

    await this.args.informationAsset.save();
  });

  @action
  attachmentsUploaded() {
    this.addModalOpened = false;
    this.fetchAttachments.perform();
  }

  @action
  reloadAttachments() {
    this.fetchAttachments.perform();
  }

  fetchAttachments = task({ keepLatest: true }, async () => {
    this.attachmentsAreLoading = true;
    this.attachmentsHaveErrored = false;
    const query = {
      reload: true,
      page: {
        number: this.args.page,
        size: this.args.size,
      },
      'filter[information-assets][:id:]': this.args.informationAsset.id,
      'filter[:not:status]': ENV.resourceStates.archived,
      sort: this.args.sort,
    };

    try {
      this.attachments = await this.store.query('file', query);
    } catch {
      this.attachmentsHaveErrored = true;
    }
    this.attachmentsAreLoading = false;
  });

  get attachmentsZipFileName() {
    return this.args.informationAsset?.title
      ? `Bijlagen ${this.args.informationAsset.title}`
      : 'Bijlagen';
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

    this.fetchAttachments.perform();

    this.closeDeleteModal();
  });
}
