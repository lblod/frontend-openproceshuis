import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnFilesIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    name: { refreshModel: true, replace: true },
  };

  resetController(controller, isExiting, transition) {
    if (isExiting) {
      controller.newFileId = undefined;
    }
    super.resetController(controller, isExiting, transition);
  }

  async model(params) {
    return {
      loadBpmnFilesTaskInstance: this.loadBpmnFilesTask.perform(params),
      loadedBpmnFiles: this.loadBpmnFilesTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnFilesTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
    };

    if (params.name) {
      query['filter[name]'] = params.name;
    }
    query['filter[:has:download]'] = 'true';

    return yield this.store.query('file', query);
  }
}
