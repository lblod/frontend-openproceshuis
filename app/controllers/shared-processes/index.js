import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';

export default class SharedProcessesIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'title'];

  @service router;
  @service toaster;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked fileToDelete = undefined;
  @tracked deleteModalOpened = false;
  @tracked uploadModalOpened = false;

  get processes() {
    return this.model.loadProcessesTaskInstance.isFinished
      ? this.model.loadProcessesTaskInstance.value
      : this.model.loadedProcesses;
  }

  get isLoading() {
    return this.model.loadProcessesTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadProcessesTaskInstance.isFinished &&
      this.processes.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadProcessesTaskInstance.isError;
  }

  @action
  setTitle(selection) {
    this.page = null;
    this.title = selection;
  }

  @action
  resetFilters() {
    this.title = '';
    this.page = 0;
    this.sort = 'title';

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
    this.fileToDelete.archive();

    try {
      yield this.fileToDelete.save();
      this.toaster.success('BPMN-bestand succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      this.toaster.error('BPMN-bestand kon niet worden verwijderd', 'Fout');
      this.fileToDelete.rollbackAttributes();
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
    this.toaster.success('BPMN-bestand succesvol toegevoegd', 'Gelukt!', {
      timeOut: 5000,
    });
    this.router.transitionTo('processes.process', newFileId);
  }
}
