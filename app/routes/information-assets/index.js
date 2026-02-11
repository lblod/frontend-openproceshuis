import Route from '@ember/routing/route';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

const FILTER_PARAM_TO_QUERY_KEY = {
  title: 'filter[title]',
  availabilityScore: 'filter[availability-score]',
  integrityScore: 'filter[integrity-score]',
  confidentialityScore: 'filter[confidentiality-score]',
  containsPersonalData: 'filter[contains-personal-data]',
  containsProfessionalData: 'filter[contains-professional-data]',
  containsSensitivePersonalData: 'filter[contains-sensitive-personal-data]',
};

function hasFilterValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function normalizeSort(sort) {
  if (!sort) {
    return '-created';
  }

  if (!sort.includes('title')) {
    return sort;
  }

  if (sort.startsWith('-')) {
    return `-:no-case:${sort.slice(1)}`;
  }

  return `:no-case:${sort}`;
}

export default class InformationAssetsIndexRoute extends Route {
  @service session;
  @service store;
  @service processApi;

  queryParams = {
    page: { refreshModel: true },
    size: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true },
    availabilityScore: { refreshModel: true },
    integrityScore: { refreshModel: true },
    confidentialityScore: { refreshModel: true },
    containsPersonalData: { refreshModel: true },
    containsProfessionalData: { refreshModel: true },
    containsSensitivePersonalData: { refreshModel: true },
  };

  beforeModel(transition) {
    super.beforeModel(...arguments);
    this.session.requireAuthentication(transition, 'auth.login');
  }

  model(params) {
    return {
      informationAssets: this.loadInformationAssetsTask.perform(params),
    };
  }

  loadInformationAssetsTask = task(
    { keepLatest: true, cancelOn: 'deactivate' },
    async (params) => {
      const query = {
        page: {
          number: params.page ?? 0,
          size: params.size ?? 20,
        },
        include: 'creator',
        'filter[:not:status]': ENV.resourceStates.archived,
        sort: normalizeSort(params.sort),
      };

      Object.entries(FILTER_PARAM_TO_QUERY_KEY).forEach(([param, queryKey]) => {
        if (hasFilterValue(params[param])) {
          if (param === 'title') {
            query['filter[:or:][title]'] = params[param];
            query['filter[:or:][description]'] = params[param];
          } else {
            query[queryKey] = params[param];
          }
        }
      });

      return this.store.query('information-asset', query);
    },
  );

  @action
  refreshModel() {
    this.refresh();
  }
}
