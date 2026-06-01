import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class SharedProcessesIndexController extends Controller {
  filters = ['title'];
  columns = ['title', 'description', 'created', 'modified', 'actions'];

  queryParams = ['page', 'size', 'sort', 'title'];

  @service router;
  @service toaster;

  @tracked page = 0;
  @tracked size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked processToDelete = undefined;
  @tracked deleteModalOpened = false;
  @tracked uploadModalOpened = false;

  newProcessId = undefined;

  get query() {
    return {
      page: this.page,
      size: this.size,
      sort: this.sort,
      title: this.title,
    };
  }

  @action
  updateQuery(query) {
    this.page = query.page;
    this.size = query.size;
    this.sort = query.sort;
    this.title = query.title;
  }

  @action
  openDeleteModal(processToDelete) {
    this.uploadModalOpened = false;
    this.processToDelete = processToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeDeleteModal() {
    this.processToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @task
  *deleteProcess() {
    this.processToDelete.archive();

    try {
      yield this.processToDelete.save();
      this.toaster.success('Proces succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.processDeletionError');
      this.toaster.error(errorMessage, 'Fout');
      this.processToDelete.rollbackAttributes();
    }

    this.closeDeleteModal();
    this.router.refresh();
  }

  @action
  openUploadModal() {
    this.deleteModalOpened = false;
    this.uploadModalOpened = true;
  }

  @action
  closeUploadModal() {
    this.uploadModalOpened = false;
    this.fileHasSensitiveInformation = false;
  }
}
