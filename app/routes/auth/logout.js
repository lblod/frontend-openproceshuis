import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AuthLogoutRoute extends Route {
  @service router;
  @service session;

  async beforeModel(transition) {
    if (this.session.requireAuthentication(transition, 'mock-login')) {
      try {
        await this.session.invalidate();
        let logoutUrl = this.router.urlFor('index');
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
}
