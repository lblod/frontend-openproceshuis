import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import { BpmnElementTypes } from '../../utils/bpmn-element-types';

export default class BpmnElementsIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    name: { refreshModel: true, replace: true },
    type: { refreshModel: true, replace: true },
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
      },
      sort: params.sort,
      include: 'processes.derivations',
    };

    if (params.name) {
      query['filter[name]'] = params.name;
    }

    if (!params.type) {
      return yield this.store.query('bpmn-element', query);
    }

    let elementType = undefined;
    switch (params.type) {
      case BpmnElementTypes.BusinessRuleTask:
        elementType = 'BusinessRuleTask';
        break;
      case BpmnElementTypes.ManualTask:
        elementType = 'ManualTask';
        break;
      case BpmnElementTypes.ReceiveTask:
        elementType = 'ReceiveTask';
        break;
      case BpmnElementTypes.ScriptTask:
        elementType = 'ScriptTask';
        break;
      case BpmnElementTypes.SendTask:
        elementType = 'SendTask';
        break;
      case BpmnElementTypes.ServiceTask:
        elementType = 'ServiceTask';
        break;
      case BpmnElementTypes.Task:
        elementType = 'Task';
        break;
      case BpmnElementTypes.UserTask:
        elementType = 'UserTask';
        break;
    }

    if (elementType)
      query[
        'filter[classification]'
      ] = `https://www.irit.fr/recherches/MELODI/ontologies/BBO#${elementType}`;

    return yield this.store.query(elementType, query);
  }
}
