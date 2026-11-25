import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ConfigurableColumnsModal extends Component {
  @service('column-configuration') columnConfigurationService;
  @service toaster;

  @action
  cancelConfiguration() {
    this.columnConfigurationService.revertConfiguration();
    this.args.closeModal?.();
  }

  @action
  saveConfiguration() {
    try {
      this.columnConfigurationService.saveConfiguration();
      this.args.closeModal?.();
    } catch {
      this.toaster.error(
        'Er liep iets mis bij het bewaren van de configuratie',
        'Kolommen',
        {
          timeOut: 5000,
        },
      );
    }
  }
}
