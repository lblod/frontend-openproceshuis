import Service from '@ember/service';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ColumnConfigurationService extends Service {
  @tracked configuration = [];

  initialize(fields) {
    this.configuration =
      this.loadConfiguration() ??
      fields.map((field, index) => {
        return {
          key: field.key,
          isFixed: Boolean(field.isFixed),
          isSelected: Boolean(field.isFixed || field.isDefault),
          position: index,
        };
      });
  }

  get sortedConfiguration() {
    return [...this.configuration].sort((a, b) => a.position - b.position);
  }

  get selectedColumns() {
    return this.sortedConfiguration.filter((column) => column.isSelected);
  }

  isSelected(key) {
    return (
      this.configuration.find((column) => column.key === key)?.isSelected ??
      false
    );
  }

  get areAllColumnsSelected() {
    return (
      this.configuration.length > 0 &&
      this.configuration.every((column) => column.isSelected)
    );
  }

  @action
  toggleAllColumns() {
    if (this.areAllColumnsSelected) {
      this.deselectAllColumns();
    } else {
      this.selectAllColumns();
    }
  }

  @action
  selectAllColumns() {
    this.configuration = this.configuration.map((column) => {
      return { ...column, isSelected: true };
    });
  }

  @action
  deselectAllColumns() {
    this.configuration = this.configuration.map((column) => {
      return { ...column, isSelected: column.isFixed };
    });
  }

  @action
  setSelectedColumns(keys) {
    this.configuration = this.configuration.map((column) => {
      return {
        ...column,
        isSelected: column.isFixed || keys.includes(column.key),
      };
    });
  }

  loadConfiguration() {
    // TODO - load from localStorage
    return null;
  }

  saveConfiguration() {
    // TODO - save to localStorage
  }
}
