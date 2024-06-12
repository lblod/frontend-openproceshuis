import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';

export default class SharedProcessesIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'title'];

  @service router;
  @service toaster;
  @service store;
  @service currentSession;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked processToDelete = undefined;
  @tracked deleteModalOpened = false;
  @tracked uploadModalOpened = false;
  newProcessId = undefined;

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
    console.log(this.processToDelete);

    try {
      yield this.processToDelete.save();
      this.toaster.success('Proces succesvol verwijderd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      console.error(error);
      this.toaster.error('Proces kon niet worden verwijderd', 'Fout');
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
  }

  @task
  *createProcess(bpmnFileId) {
    const bpmnFile = yield this.store.findRecord('file', bpmnFileId);

    const created = new Date();
    const process = this.store.createRecord('process', {
      title: bpmnFile.name,
      description: 'Dit is een test',
      created: created,
      modified: created,
      publisher: this.currentSession.group,
      files: [bpmnFile],
    });
    yield process.save();
    this.newProcessId = process.id;
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *extractBpmnElements(bpmnFileId) {
    yield fetch(`/bpmn?id=${bpmnFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @action
  bpmnFileUploaded() {
    this.closeUploadModal();
    this.toaster.success('Proces succesvol toegevoegd', 'Gelukt!', {
      timeOut: 5000,
    });
    this.router.transitionTo('processes.process', this.newProcessId);
  }
}
