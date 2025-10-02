import Controller from '@ember/controller';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]',
);

export default class ApplicationController extends Controller {
  @service currentSession;
  @service router;

  get environmentName() {
    return isLocalhost ? 'local' : ENV.environmentName;
  }

  get environmentTitle() {
    return isLocalhost ? 'lokalomgeving' : ENV.environmentTitle;
  }

  get showEnvironment() {
    return (
      this.environmentName && this.environmentName !== '{{ENVIRONMENT_NAME}}'
    );
  }

  get isProcessBarShown() {
    if (!this.currentSession.isAuthenticated) {
      return false;
    }

    return [
      'processes',
      'shared-processes',
      'my-local-government',
      'inventory',
    ].includes(this.compareRouteName);
  }

  get isBreadcrumbBarShown() {
    return !['application', 'auth'].includes(this.compareRouteName);
  }

  get compareRouteName() {
    return (
      this.router.currentRoute?.parent?.name || this.router.currentRoute?.name
    );
  }
}
