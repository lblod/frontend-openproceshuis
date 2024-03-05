import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';

export default class BpmnUploadsBpmnFileIndexController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';
  @tracked fileModalOpened = false;
  @tracked edit = false;

  get bpmnElements() {
    return this.model.loadBpmnElementsTaskInstance.isFinished
      ? this.model.loadBpmnElementsTaskInstance.value
      : this.model.loadedBpmnElements;
  }

  get isLoading() {
    return this.model.loadBpmnElementsTaskInstance.isRunning;
  }

  get hasPreviousData() {
    return (
      this.model.loadedBpmnElements && this.model.loadedBpmnElements.length > 0
    );
  }

  get hasNoResults() {
    return (
      this.model.loadBpmnElementsTaskInstance.isFinished &&
      this.bpmnElements.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadBpmnElementsTaskInstance.isError;
  }

  @action
  resetFilters() {
    this.page = 0;
    this.sort = 'name';

    // Triggers a refresh of the model
    this.page = null;
  }

  @action
  openFileModal() {
    this.fileModalOpened = true;
  }

  @action
  closeFileModal() {
    this.fileModalOpened = false;
  }

  @action
  fileUploaded() {
    this.closeFileModal();
    this.resetFilters();
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }

  @action
  cancelEdit() {
    this.resetModel();
    this.toggleEdit();
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    const file = this.model.metadata;
    if (file.hasDirtyAttributes) {
      file.modified = new Date();
      yield file.save();
    }

    this.toggleEdit();
  }

  resetModel() {
    this.model.metadata.rollbackAttributes();
  }

  @action
  setFileName(event) {
    this.model.metadata.name = event.target.value;
  }

  @action
  setFileDescription(event) {
    this.model.metadata.description = event.target.value;
  }
}
