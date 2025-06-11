import Controller from '@ember/controller';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]',
);

export default class ApplicationController extends Controller {
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

  get maintenanceEnabled() {
    return ENV.announce.maintenance.enabled === 'true';
  }

  get maintenanceMessage() {
    return ENV.announce.maintenance.message;
  }
}
