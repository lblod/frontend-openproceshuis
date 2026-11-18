import Service from '@ember/service';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ColumnConfigurationService extends Service {
  @tracked configuration = [];

  fields = [];

  initialize(fields) {
    this.fields = fields;
    this.configuration = this.loadConfiguration() ?? this.defaultConfiguration;
  }

  get defaultConfiguration() {
    return this.fields.map((field, index) => {
      return {
        key: field.key,
        isFixed: Boolean(field.isFixed),
        isSelected: Boolean(field.isFixed || field.isDefault),
        position: index,
      };
    });
  }

  @action
  resetConfiguration() {
    this.configuration = this.defaultConfiguration;
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

  @action
  reorderColumns(keys) {
    const positions = this.configuration
      .filter((column) => keys.includes(column.key))
      .map((column) => column.position)
      .sort((a, b) => a - b);

    this.configuration = this.configuration.map((column) => {
      const index = keys.indexOf(column.key);

      if (index === -1) {
        return column;
      }

      return { ...column, position: positions[index] };
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
