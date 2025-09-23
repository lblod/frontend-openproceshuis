import { inject as service } from '@ember/service';
import SessionService from 'ember-simple-auth/services/session';

export default class OPHSessionService extends SessionService {
  @service currentSession;

  get isMockLoginSession() {
    return this.isAuthenticated
      ? this.data.authenticated.authenticator.includes('mock-login')
      : false;
  }

  async handleAuthentication(routeAfterAuthentication) {
    await this.currentSession.load();
    const url = localStorage.getItem('BEFORE_LOGIN_URL');
    if (url) {
      window.location.replace(url);
    } else {
      super.handleAuthentication(routeAfterAuthentication);
    }
  }

  handleInvalidation() {
    // Invalidation is handled in the relevant routes directly
  }

  setRouteForAfterLogin() {
    localStorage.setItem('BEFORE_LOGIN_URL', window.location.href);
    alert('DONE');
  }
}
