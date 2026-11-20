import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ConfigurableColumnsModal extends Component {
  @service('column-configuration') columnConfigurationService;
  @service toaster;

  @action
  cancelConfiguration() {
    this.columnConfigurationService.revertConfiguration();
    this.toaster.success('Configuratie werd succesvol teruggezet', 'Kolommen', {
      timeOut: 3000,
    });
    this.args.closeModal?.();
  }

  @action
  saveConfiguration() {
    try {
      this.columnConfigurationService.saveConfiguration();
      this.toaster.success('Configuratie succesvol bewaard', 'Kolommen', {
        timeOut: 3000,
      });
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
