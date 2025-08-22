import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AdminPanelIndexRoute extends Route {
  @service session;
  @service currentSession;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'index');
    if (!this.currentSession.isAdmin) this.router.transitionTo('unauthorized');
  }
}
