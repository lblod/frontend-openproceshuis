import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessInventoryProcessCardPopup extends Component {
  @service store;
  @tracked page = 0;
  @tracked size = 10;

  constructor(...args) {
    super(...args);
    this.loadConceptualProcessesTask.perform();
  }

  get conceptualProcesses() {
    return this.loadConceptualProcessesTask.lastSuccessful?.value;
  }

  get isLoading() {
    return this.loadConceptualProcessesTask.isRunning;
  }

  @keepLatestTask()
  *loadConceptualProcessesTask() {
    let query = {
      reload: true,
      page: { number: this.page, size: this.size },
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    return yield this.store.query('conceptual-process', query);
  }

  @action
  handlePageChange(newPage) {
    this.page = newPage;
    this.loadConceptualProcessesTask.perform();
  }

  @action
  handleSizeChange(newSize) {
    this.size = newSize;
    this.page = 0;
    this.loadConceptualProcessesTask.perform();
  }
  @action
  mockOnchange() {
    console.log('on change called');
  }

  @action
  resetFilters() {
    console.log('reset filters');
  }
}
