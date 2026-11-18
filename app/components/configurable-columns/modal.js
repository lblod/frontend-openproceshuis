import Component from '@glimmer/component';

import { service } from '@ember/service';

export default class ConfigurableColumnsModal extends Component {
  @service('column-configuration') columnConfigurationService;
}
