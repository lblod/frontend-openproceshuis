import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class SharedProcessesIndexRoute extends Route {
  @service router;
  @service session;
  @service currentSession;
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true, replace: true },
  };

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'index');

    if (this.currentSession.readOnly) this.router.transitionTo('unauthorized');
  }

  async model(params) {
    return {
      loadProcessesTaskInstance: this.loadProcessesTask.perform(params),
      loadedProcesses: this.loadProcessesTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessesTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include:
        'publisher,publisher.primary-site,publisher.primary-site.contacts',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.title) {
      query['filter[title]'] = params.title;
    }
    query['filter[publisher][id]'] = this.currentSession.group.id;
    query['filter[:not:status]'] = ENV.resourceStates.archived;

    return yield this.store.query('process', query);
  }
}
