import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true, replace: true },
  };

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
        'publisher,publisher.primary-site,publisher.primary-site.contacts,publisher.classification',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;

      if (fieldName === 'organization') fieldName = 'publisher.name';
      else if (fieldName === 'classification')
        fieldName = 'publisher.classification';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.title) {
      query['filter[:or:][title]'] = params.title;
      query['filter[:or:][description]'] = params.title;
    }
    query['filter[:not:status]'] = ENV.resourceStates.archived;

    return yield this.store.query('process', query);
  }
}
