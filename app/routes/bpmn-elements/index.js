import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnElementsIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    name: { refreshModel: true, replace: true },
  };

  async model(params) {
    return {
      loadBpmnFilesTaskInstance: this.loadbpmnElementsTask.perform(params),
      loadedBpmnFiles: this.loadbpmnElementsTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadbpmnElementsTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
        include: 'processes.derivations',
      },
    };

    if (params.name) {
      query['filter[name]'] = params.name;
    }

    return yield this.store.query('bpmn-element', query);
  }
}
