import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ProcessesIndexController extends Controller {
  queryParams = [
    'page',
    'size',
    'sort',
    'title',
    'classification',
    'group',
    'blueprint',
  ];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked classification = '';
  @tracked selectedClassification = '';
  @tracked group = '';
  @tracked blueprint = false;
  @service currentSession;

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
    this.selectedClassification = selection;
    this.classification = selection?.label;
  }

  @action
  setGroup(selection) {
    this.page = null;
    this.group = selection;
  }

  @action
  toggleBlueprintFilter(event) {
    this.page = null;
    this.blueprint = event;
  }

  @action
  processIsUsedBy(usersArray) {
    return usersArray.includes(this.currentSession.group);
  }

  @action
  resetFilters() {
    this.title = '';
    this.classification = '';
    this.selectedClassification = '';
    this.group = '';
    this.page = 0;
    this.sort = 'title';
    this.blueprint = false;

    // Triggers a refresh of the model
    this.page = null;
  }
}
