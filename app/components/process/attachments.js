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
import { trackedFunction } from 'reactiveweb/function';
import { use } from 'ember-resources';

export default class ProcessAttachments extends Component {
  @service api;
  @service router;
  @service store;
  @service toaster;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;
  @tracked fileToDelete = undefined;

  @use(getAttachments) getAttachments;
  @tracked filesMeta = {};

  get process() {
    return this.args.process;
  }

  get attachmentsHaveNoResults() {
    return (
      !this.getAttachments.isLoading &&
      !this.getAttachments.isError &&
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
    this.args.reloadTableData?.();
  }

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
      this.args.reloadTableData?.();
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.fileDeletionError');
      this.toaster.error(errorMessage, 'Fout');
      this.fileToDelete.rollbackAttributes();
    }

    this.closeDeleteModal();
  });

  fetchAttachments = task(
    { restartable: true },
    async ({ page = 0, size = 10, sort = 'name' }) => {
      try {
        const processes = await this.store.query('process', {
          'filter[id]': this.process.id,
          include: 'attachments',
          page: { size: 1 },
        });
        const process = processes[0];
        const processFileIds = process?.attachments.map((file) => file.id);

        const infoAssetIds = this.process.informationAssets.map(
          (asset) => asset.id,
        );
        const infoAssetFiles = await this.store.query('file', {
          reload: true,
          'filter[information-asset][id]': infoAssetIds.join(','),
          'filter[:not:status]': ENV.resourceStates.archived,

          include: 'information-asset',
          sort: sort,
        });
        const infoAssetFileIds = infoAssetFiles.map((file) => file.id);

        let files = [];
        if (processFileIds.length >= 1 || infoAssetFiles.length >= 1) {
          files = await this.store.query('file', {
            page: {
              number: page,
              size: size,
            },
            'filter[id]': [...processFileIds, ...infoAssetFileIds].join(','),
            'filter[:not:status]': ENV.resourceStates.archived,
            sort: sort,
          });
        }
        this.filesMeta = files.meta;
        return files;
      } catch {
        return [];
      }
    },
  );

  get attachments() {
    return this.getAttachments?.value;
  }
}

function getAttachments() {
  return trackedFunction(async () => {
    return this.fetchAttachments.perform({
      page: this.args.page,
      size: this.args.size,
      sort: this.args.sort,
    });
  });
}
