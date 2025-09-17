import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class InventoryAdminRoute extends Route {
  @service session;
  @service currentSession;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'index');
    if (!this.currentSession.isAdmin) this.router.transitionTo('unauthorized');
  }
}
