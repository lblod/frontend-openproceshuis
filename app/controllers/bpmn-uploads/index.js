import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

export default class BpmnUploadsIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'name'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';
  @tracked name = '';
  @tracked deleteModalOpened = false;
  @tracked fileToDelete = undefined;
  @tracked uploadModalOpened = false;
  @tracked newFileId = undefined;

  get bpmnFiles() {
    return this.model.loadBpmnFilesTaskInstance.isFinished
      ? this.model.loadBpmnFilesTaskInstance.value
      : this.model.loadedBpmnFiles;
  }

  get isLoading() {
    return this.model.loadBpmnFilesTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadBpmnFilesTaskInstance.isFinished &&
      this.bpmnFiles.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadBpmnFilesTaskInstance.isError;
  }

  @action
  setName(selection) {
    this.page = null;
    this.name = selection;
  }

  @action
  resetFilters() {
    this.name = '';
    this.page = 0;
    this.sort = 'name';

    // Triggers a refresh of the model
    this.page = null;
  }

  @action
  openDeleteModal(fileToDelete) {
    this.uploadModalOpened = false;
    this.fileToDelete = fileToDelete;
    this.deleteModalOpened = true;
  }

  @action
  closeDeleteModal() {
    this.fileToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @task
  *deleteFile() {
    this.fileToDelete.archived = true;
    yield this.fileToDelete.save();
    this.fileToDelete = undefined;
    this.deleteModalOpened = false;
  }

  @action
  openUploadModal() {
    this.deleteModalOpened = false;
    this.newFileId = undefined;
    this.uploadModalOpened = true;
  }

  @action
  closeUploadModal() {
    this.uploadModalOpened = false;
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *extractBpmn(newFileId) {
    yield fetch(`/bpmn?id=${newFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @action
  fileUploaded(newFileId) {
    this.closeUploadModal();
    this.resetFilters();
    this.newFileId = newFileId;
  }

  @action
  closeAlert() {
    this.newFileId = undefined;
  }
}
