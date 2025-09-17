import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class InventoryAdminRoute extends Route {
  @service session;
  @service currentSession;
  @service processApi;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'index');
    if (!this.currentSession.isAdmin) this.router.transitionTo('unauthorized');
  }

  async model() {
    const categories = await this.processApi.getConceptualCategories();
    return {
      categories,
    };
  }
}
