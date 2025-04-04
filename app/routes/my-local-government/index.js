import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class MyLocalGovernmentIndexRoute extends Route {
  @service currentSession;
  @service store;
  @service session;
  @service router;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true, replace: true },
    classification: { refreshModel: true, replace: true },
    group: { refreshModel: true, replace: true },
    blueprint: { refreshModel: true },
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
        'publisher,users,publisher.primary-site,publisher.primary-site.contacts,publisher.classification',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;

      if (fieldName === 'organization') fieldName = 'publisher.name';
      else if (fieldName === 'classification')
        fieldName = 'publisher.classification.label';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.title) {
      query['filter[:or:][title]'] = params.title;
      query['filter[:or:][description]'] = params.title;
    }

    if (params.classification)
      query['filter[publisher][classification][:exact:label]'] =
        params.classification;

    if (params.group) query['filter[publisher][:exact:name]'] = params.group;

    if (params.blueprint) {
      query['filter[is-blueprint]'] = params.blueprint;
    }

    query['filter[:or:][users][id]'] = this.currentSession.group.id;
    query['filter[:or:][publisher][id]'] = this.currentSession.group.id;
    query['filter[:not:status]'] = ENV.resourceStates.archived;

    return yield this.store.query('process', query);
  }
}
