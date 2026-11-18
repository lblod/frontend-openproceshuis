import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ConfigurableColumnsManageColumns extends Component {
  @service('field') fieldService;
  @service('column-configuration') columnConfigurationService;

  get selectedColumns() {
    return this.columnConfigurationService.sortedConfiguration
      .filter((column) => column.isSelected)
      .map((column) =>
        this.fieldService.dynamicFields.find(
          (field) => field.key === column.key,
        ),
      )
      .filter(Boolean);
  }

  @action
  resetConfiguration() {
    this.columnConfigurationService.resetConfiguration();
  }
}
