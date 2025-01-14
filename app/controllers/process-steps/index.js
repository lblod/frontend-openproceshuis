import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessStepsIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'name', 'type'];

  @tracked page = 0;
  size = 20;
  @tracked sort = '';
  @tracked name = '';
  @tracked type = '';
  @tracked selectedType = '';

  get processSteps() {
    return this.model.loadProcessStepsTaskInstance.isFinished
      ? this.model.loadProcessStepsTaskInstance.value
      : this.model.loadedProcessSteps;
  }

  get isLoading() {
    return this.model.loadProcessStepsTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadProcessStepsTaskInstance.isFinished &&
      this.processSteps?.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadProcessStepsTaskInstance.isError;
  }

  @action
  setName(selection) {
    this.page = null;
    this.name = selection;
  }

  @action
  setType(selection) {
    this.page = null;
    this.selectedType = selection;
    this.type = selection?.queryValue;
  }

  @action
  resetFilters() {
    this.name = '';
    this.type = '';
    this.selectedType = '';
    this.page = 0;
    this.sort = '';

    // Triggers a refresh of the model
    this.page = null;
  }
}
