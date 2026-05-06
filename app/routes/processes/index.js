import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesIndexRoute extends Route {
  @service session;
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true, replace: true },
    modifiedSince: { refreshModel: true, replace: true },
    classifications: { refreshModel: true, replace: true },
    group: { refreshModel: true, replace: true },
    creator: { refreshModel: true, replace: true },
    blueprint: { refreshModel: true },
    ipdcProducts: { refreshModel: true, replace: true },
  };

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model(params) {
    return {
      loadProcessesTaskInstance: this.loadProcessesTask.perform(params),
      loadedProcesses: this.loadProcessesTask.lastSuccesful?.value,
    };
  }

  loadProcessesTask = task(
    { keepLatest: true, cancelOn: 'deactivate' },
    async (params) => {
      let query = {
        page: {
          number: params.page,
          size: params.size,
        },
        include: [
          'publisher',
          'creator',
          'users',
          'publisher.primary-site',
          'publisher.primary-site.contacts',
          'publisher.classification',
          'relevant-administrative-units',
          'ipdc-products',
        ].join(','),
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

      if (params.modifiedSince) {
        query['filter[:gte:modified]'] = params.modifiedSince;
      }

      if (params.classifications) {
        query['filter[relevant-administrative-units][:id:]'] =
          params.classifications;
      }

      if (params.group) query['filter[publisher][:exact:name]'] = params.group;
      if (params.creator)
        query['filter[creator][:exact:name]'] = params.creator;

      if (params.blueprint) {
        query['filter[is-blueprint]'] = params.blueprint;
      }

      if (params.ipdcProducts) {
        query['filter[ipdc-products][:id:]'] = params.ipdcProducts;
      }

      query['filter[:not:status]'] = ENV.resourceStates.archived;
      query['filter[:not:is-versioned-resource]'] = true;

      return await this.store.query('process', query);
    },
  );
}
