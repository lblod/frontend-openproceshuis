import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    return {
      loadConceptualProcessesTaskInstance:
        this.loadConceptualProcessesTask.perform(params),
      loadedConceptualProcesses:
        this.loadConceptualProcessesTask.lastSuccesful?.value,
      categories: this.store.findAll('process-category', { sort: 'label' }),
      domains: this.store.findAll('process-domain', { sort: 'label' }),
      groups: this.store.findAll('process-group', { sort: 'label' }),
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadConceptualProcessesTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;

      if (fieldName === 'group') fieldName = 'process-groups.label';
      else if (fieldName === 'domain')
        fieldName = 'process-groups.process-domains.label';
      else if (fieldName === 'category')
        fieldName = 'process-groups.process-domains.process-categories.label';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    query['filter[:not:status]'] = ENV.resourceStates.archived;

    return yield this.store.query('conceptual-process', query);
  }
}
