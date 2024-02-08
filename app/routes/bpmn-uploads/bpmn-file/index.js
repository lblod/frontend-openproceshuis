import Route from '@ember/routing/route';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import { BpmnElementTypes } from '../../../utils/bpmn-element-types';

export default class BpmnUploadsBpmnFileIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    name: { refreshModel: true, replace: true },
    type: { refreshModel: true, replace: true },
  };

  async model(params) {
    // Fetching metadata and diagram for a specific BPMN file
    let metadata = this.modelFor('bpmn-uploads.bpmn-file');
    let diagram = await this.fetchBpmnXml(metadata.id);

    // Performing the task to load BPMN elements based on parameters
    let loadBpmnFilesTaskInstance = await this.loadbpmnElementsTask.perform(
      params
    );
    let loadedBpmnFiles = this.loadbpmnElementsTask.lastSuccessful?.value;

    // Combining both parts into a single model object
    return {
      metadata,
      diagram,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
    };
  }

  async fetchBpmnXml(id) {
    const url = generateBpmnDownloadUrl(id);
    const response = await fetch(url);
    return await response.text();
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

    let queryType;
    switch (params.type) {
      case BpmnElementTypes.BusinessRuleTask:
        queryType = 'business-rule-task';
        break;
      case BpmnElementTypes.ManualTask:
        queryType = 'manual-task';
        break;
      case BpmnElementTypes.ReceiveTask:
        queryType = 'receive-task';
        break;
      case BpmnElementTypes.ScriptTask:
        queryType = 'script-task';
        break;
      case BpmnElementTypes.SendTask:
        queryType = 'send-task';
        break;
      case BpmnElementTypes.ServiceTask:
        queryType = 'service-task';
        break;
      case BpmnElementTypes.Task:
        queryType = 'task';
        break;
      case BpmnElementTypes.UserTask:
        queryType = 'user-task';
        break;
      default:
        queryType = 'bpmn-element';
    }

    return yield this.store.query(queryType, query);
  }
}
