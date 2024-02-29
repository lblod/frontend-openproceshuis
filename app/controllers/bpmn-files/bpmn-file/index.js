import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class BpmnFilesBpmnFileIndexController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';

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
}
