import Component from '@glimmer/component';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessInventoryProcessCardPopup extends Component {
  @service store;

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
      page: { size: 1000 },
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    return yield this.store.query('conceptual-process', query);
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
