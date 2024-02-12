import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class BpmnElementsIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'name', 'type'];

  @tracked page = 0;
  size = 20;
  @tracked sort = '';
  @tracked name = '';
  @tracked type = '';

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
    this.sort = '';

    // Triggers a refresh of the model
    this.page = null;
  }
}
