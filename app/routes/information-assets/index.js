import Route from '@ember/routing/route';

import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InformationAssetsIndexRoute extends Route {
  @service session;
  @service store;
  @service processApi;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true },
  };

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model(params) {
    return {
      informationAssets: this.loadInformationAssetsTask.perform(params),
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadInformationAssetsTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'creator',
      'filter[:not:status]': ENV.resourceStates.archived,
      sort: ':no-case:title',
    };
    if (params.title) {
      query['filter[title]'] = params.title;
    }

    return yield this.store.query('information-asset', query);
  }
}
