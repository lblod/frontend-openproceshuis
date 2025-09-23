import SessionService from 'ember-simple-auth/services/session';

import { service } from '@ember/service';

export default class OPHSessionService extends SessionService {
  @service currentSession;
  @service router;

  get isMockLoginSession() {
    return this.isAuthenticated
      ? this.data.authenticated.authenticator.includes('mock-login')
      : false;
  }

  async handleAuthentication(routeAfterAuthentication) {
    await this.currentSession.load();
    const pathName = localStorage.getItem('BEFORE_LOGIN_PATH');
    if (pathName) {
      this.router.replaceWith(pathName);
      localStorage.removeItem('BEFORE_LOGIN_PATH');
    } else {
      super.handleAuthentication(routeAfterAuthentication);
    }
  }

  handleInvalidation() {
    // Invalidation is handled in the relevant routes directly
  }

  setRouteForAfterLogin() {
    localStorage.setItem('BEFORE_LOGIN_PATH', window.location.pathname);
  }
}
