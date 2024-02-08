import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class BpmnUploadsBpmnFileIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'name', 'type'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';
  @tracked name = '';
  @tracked type = '';
  @tracked fileModalOpened = false;
  @tracked edit = false;

  get bpmnElements() {
    return this.model.loadBpmnFilesTaskInstance.isFinished
      ? this.model.loadBpmnFilesTaskInstance.value
      : this.model.loadedBpmnFiles;
  }

  get isLoading() {
    return this.model.loadBpmnFilesTaskInstance.isRunning;
  }

  get hasPreviousData() {
    return this.model.loadedBpmnFiles && this.model.loadedBpmnFiles.length > 0;
  }

  get hasNoResults() {
    return (
      this.model.loadBpmnFilesTaskInstance.isFinished &&
      this.bpmnElements.length === 0
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
  setType(selection) {
    this.page = null;
    this.type = selection;
  }

  @action
  resetFilters() {
    this.name = '';
    this.type = '';
    this.page = 0;
    this.sort = 'name';

    // Triggers a refresh of the model
    this.page = null;
  }

  @action
  openFileModal() {
    this.newFileId = undefined;
    this.fileModalOpened = true;
  }

  @action
  closeFileModal() {
    this.fileModalOpened = false;
  }

  @action
  fileUploaded(newFileId) {
    this.closeFileModal();
    this.resetFilters();
    this.newFileId = newFileId;
  }

  @action
  closeAlert() {
    this.newFileId = undefined;
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }
}