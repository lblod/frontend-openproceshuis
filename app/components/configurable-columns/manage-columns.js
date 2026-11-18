import Component from '@glimmer/component';

import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class ConfigurableColumnsManageColumns extends Component {
  @service('field') fieldService;
  @service('column-configuration') columnConfigurationService;

  @cached
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
  updateColumnOrder({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) {
      return;
    }

    const keys = this.selectedColumns.map((field) => field.key);
    const [movedKey] = keys.splice(sourceIndex, 1);
    keys.splice(targetIndex, 0, movedKey);

    this.columnConfigurationService.reorderColumns(keys);
  }

  @action
  resetConfiguration() {
    this.columnConfigurationService.resetConfiguration();
  }
}
