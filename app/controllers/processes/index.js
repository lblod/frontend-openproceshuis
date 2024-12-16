import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
export default class ProcessesIndexController extends Controller {
  queryParams = ['page', 'size', 'sort', 'title'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked classification = '';

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
      this.processes?.length === 0
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
  setClassification(selection) {
    this.page = null;
    this.classification = selection;
  }

  @action
  resetFilters() {
    this.title = '';
    this.classification = '';
    this.page = 0;
    this.sort = 'title';

    // Triggers a refresh of the model
    this.page = null;
  }
}
