import Route from '@ember/routing/route';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessRoute extends Route {
  @service store;

  async model(params) {
    const query = {
      reload: true,
      include:
        'process-statistics,files,publisher,publisher.primary-site,publisher.primary-site.contacts,publisher.classification,ipdc-products,information-assets,linked-concept',
      'filter[files][:not:status]': ENV.resourceStates.archived,
    };
    return await this.store.findRecord('process', params.id, query);
  }
}
