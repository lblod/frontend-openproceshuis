import Route from '@ember/routing/route';
import { service } from '@ember/service';
import config from 'frontend-openproceshuis/config/environment';

export default class ApplicationRoute extends Route {
  @service router;
  @service currentSession;
  @service session;
  @service plausible;

  async beforeModel() {
    await this.startAnalytics();
    await this.session.setup();
    try {
      await this.currentSession.load();
    } catch {
      this.router.transitionTo('auth.logout');
    }
  }

  async startAnalytics() {
    const plausibleConfig = config['ember-plausible'];
    // if (plausibleConfig && config.environment === 'production')
    if (plausibleConfig) return this.plausible.enable(plausibleConfig);
  }
}
