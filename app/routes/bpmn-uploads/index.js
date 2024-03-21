import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnUploadsIndexRoute extends Route {
  @service router;
  @service session;
  @service currentSession;
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    name: { refreshModel: true, replace: true },
  };

  resetController(controller, isExiting, transition) {
    if (isExiting) {
      controller.newFileId = undefined;
    }
    super.resetController(controller, isExiting, transition);
  }

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'mock-login');

    if (this.currentSession.canOnlyRead)
      this.router.transitionTo('unauthorized');
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

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.name) {
      query['filter[name]'] = params.name;
    }
    query['filter[:has:download]'] = 'true';
    query['filter[publisher][id]'] = this.currentSession.group.id; // FIXME: should be handled by backend instead of frontend

    return yield this.store.query('file', query);
  }
}
