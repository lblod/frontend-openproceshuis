import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepSelectByNameComponent extends Component {
  @service store;

  @restartableTask *loadProcessStepsTask(searchParams = '') {
    const query = {
      'filter[:has:bpmn-process]': true,
      'filter[bpmn-process][:has:bpmn-file]': true,
      'filter[bpmn-process][bpmn-file][:not:status]':
        ENV.resourceStates.archived,
      'filter[bpmn-process][bpmn-file][:has:processes]': true,
      'filter[bpmn-process][bpmn-file][processes][:not:status]':
        ENV.resourceStates.archived,
    };

    if (searchParams.trim() !== '') {
      query['filter[name]'] = searchParams;
    }

    const result = yield this.store.query('bpmn-element', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.name))];
    }
  }
}
