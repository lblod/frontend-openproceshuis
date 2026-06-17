import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';
import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessAttachments extends Component {
  @service api;
  @service router;
  @service store;
  @service toaster;
  @tracked addModalOpened = false;
  @tracked deleteModalOpened = false;
  @tracked fileToDelete = undefined;

  @tracked filesMeta = {};

  get process() {
    return this.args.process;
  }

  get currentProcessRouteName() {
    return this.router.currentRouteName?.replace('.index', '');
  }

  get attachmentsHaveNoResults() {
    return (
      !this.fetchAttachments.isRunning &&
      !this.fetchAttachments.isError &&
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
    this.args.onSaved?.();
  }

  get attachmentsZipFileName() {
    return this.process?.title ? `Bijlagen ${this.process.title}` : 'Bijlagen';
  }

  deleteFile = task({ drop: true }, async () => {
    if (!this.fileToDelete) return;

    this.fileToDelete.archive();

    try {
      await this.fileToDelete.save();
      this.toaster.success('Bestand succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
      this.args.process.applyVersioning.perform();
      this.args.reloadTableData?.();
      this.args.onSaved?.();
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.fileDeletionError');
      this.toaster.error(errorMessage, 'Fout');
      this.fileToDelete.rollbackAttributes();
    }

    this.closeDeleteModal();
  });

  get sort() {
    return this.args.sort ?? 'name';
  }

  async fetchProcessAttachmentFileIds(processId) {
    const processes = await this.store.query('process', {
      'filter[id]': processId,
      include: 'attachments,information-assets,information-assets.attachments',
      page: { size: 1 },
      reload: true,
    });
    const process = processes[0];
    return process?.attachments.map((file) => file.id) ?? [];
  }

  async fetchProcessIcrFileIds(informationAssets) {
    let infoAssetFileIds = [];
    const icrFiles = [];
    for (const infoAsset of informationAssets) {
      icrFiles.push(...infoAsset.attachments);
    }
    if (icrFiles?.length >= 1) {
      const infoAssetFiles = await this.store.query('file', {
        'filter[:id:]': icrFiles.map((file) => file.id).join(','),
        sort: this.sort,
      });
      infoAssetFileIds = infoAssetFiles.map((file) => file.id);
    }

    return infoAssetFileIds;
  }

  async fetchFilesWithIds(fileIds, page, size, includeArchived = false) {
    const query = {
      page: {
        number: page,
        size: size,
      },
      'filter[id]': fileIds.join(','),
      sort: this.sort,
      include: 'information-assets',
    };

    if (!includeArchived) {
      query['filter[:not:status]'] = ENV.resourceStates.archived;
    }

    return await this.store.query('file', query);
  }

  fetchAttachments = task({ restartable: true }, async (_process, page = 0) => {
    try {
      const process = await this.store.findRecord('process', _process.id, {
        include:
          'attachments,information-assets,information-assets.attachments',
      });

      const processFiles =
        process?.attachments?.filter((f) => !f.isArchived) ?? [];

      const icrSourceMap = new Map();
      for (const icrAsset of process.informationAssets) {
        const files = icrAsset.attachments.filter((f) => !f.isArchived) ?? [];
        for (const file of files) {
          icrSourceMap.set(file.id, {
            id: icrAsset.id,
            title: icrAsset.title ?? '/',
          });
        }
      }

      const fileIds = [
        ...processFiles.map((f) => f.id),
        ...icrSourceMap.keys(),
      ];

      this.filesMeta = {};
      const result = await this.store.query('file', {
        'filter[id]': fileIds.join(','),
        page: {
          number: page,
          size: this.args.size ?? 10,
        },
        sort: this.sort,
      });
      this.filesMeta = result.meta;

      for (const file of result) {
        const source = icrSourceMap.get(file.id);
        if (source) {
          file._icrSource = source;
        }
      }

      return result;
    } catch {
      return [];
    }
  });

  fetchFilesForComparison = task(
    { restartable: true },
    async (versionedProcess) => {
      try {
        const processFileIds = await this.fetchProcessAttachmentFileIds(
          this.args.process.id,
        );
        const infoAssetFileIds = await this.fetchProcessIcrFileIds(
          this.args.process.informationAssets,
        );

        const currentFiles = await this.fetchFilesWithIds(
          [...processFileIds, ...infoAssetFileIds],
          0,
          9999,
          true,
        );

        const versionedProcessFileIds =
          await this.fetchProcessAttachmentFileIds(versionedProcess.id);
        const versionedInfoAssetFileIds = await this.fetchProcessIcrFileIds(
          versionedProcess.informationAssets,
        );
        const versionedFiles = await this.fetchFilesWithIds(
          [...versionedProcessFileIds, ...versionedInfoAssetFileIds],
          0,
          9999,
          true,
        );

        return {
          forCurrent: Array.from(currentFiles),
          forVersion: Array.from(versionedFiles),
        };
      } catch {
        return {
          forCurrent: [],
          forVersion: [],
        };
      }
    },
  );

  fetchRelevantLinksForComparison = task(
    { restartable: true },
    async (versionedProcess) => {
      try {
        const current = await this.args.process.links;
        const version = await versionedProcess.links;

        return {
          forCurrent: Array.from(current),
          forVersion: Array.from(version),
        };
      } catch (error) {
        return {
          forCurrent: [],
          forVersion: [],
        };
      }
    },
  );

  attachments = trackedTask(this, this.fetchAttachments, () => [
    this.args.process,
    this.args.page,
    this.args.sort,
  ]);

  versionedFiles = trackedTask(this, this.fetchFilesForComparison, () => [
    this.args.versionedProcess,
    this.args.page,
  ]);

  versionedLinks = trackedTask(
    this,
    this.fetchRelevantLinksForComparison,
    () => [this.args.versionedProcess],
  );
}
