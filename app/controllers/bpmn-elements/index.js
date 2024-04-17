import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class BpmnElementsIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'name', { typeQueryValue: 'type' }];

  @tracked page = 0;
  size = 20;
  @tracked sort = '';
  @tracked name = '';
  @tracked type = null;
  @tracked typeQueryValue = '';

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
  setName(selection) {
    this.page = null;
    this.name = selection;
  }

  @action
  setType(selection) {
    this.page = null;
    this.type = selection;
    this.typeQueryValue = this.type?.queryValue ?? '';
  }

  @action
  resetFilters() {
    this.name = '';
    this.type = null;
    this.typeQueryValue = '';
    this.page = 0;
    this.sort = '';

    // Triggers a refresh of the model
    this.page = null;
  }
}
