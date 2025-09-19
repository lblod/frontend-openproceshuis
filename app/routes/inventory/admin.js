import Route from '@ember/routing/route';

import { service } from '@ember/service';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryAdminRoute extends Route {
  @service session;
  @service currentSession;
  @service store;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'index');
    if (!this.currentSession.isAdmin) this.router.transitionTo('unauthorized');
  }

  async model() {
    const categories = await this.store.query('process-category', {
      'filter[:exact:scheme]': ENV.conceptSchemes.processCategories,
      page: { size: 500 },
      sort: 'label',
    });
    return {
      categories,
    };
  }
}
