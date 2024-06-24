import Route from '@ember/routing/route';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ApplicationRoute extends Route {
  @service router;
  @service currentSession;
  @service session;
  @service plausible;

  async beforeModel() {
    this.startAnalytics();
    await this.session.setup();
    try {
      await this.currentSession.load();
    } catch {
      this.router.transitionTo('auth.logout');
    }
  }

  async startAnalytics() {
    let { domain, apiHost } = ENV.plausible;

    if (
      domain !== '{{ANALYTICS_APP_DOMAIN}}' &&
      apiHost !== '{{ANALYTICS_API_HOST}}'
    )
      this.plausible.enable({ domain, apiHost });
  }
}
