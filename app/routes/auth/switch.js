import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class AuthSwitchRoute extends Route {
  @service router;
  @service session;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'mock-login');

    try {
      await this.session.invalidate();
      let logoutUrl = this.router.urlFor('mock-login');
      window.location.replace(logoutUrl);
    } catch (error) {
      throw new Error(
        'Something went wrong while trying to remove the session on the server',
        {
          cause: error,
        }
      );
    }
  }
}
