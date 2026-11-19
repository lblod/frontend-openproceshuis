import Service from '@ember/service';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { isAttachedField } from 'frontend-openproceshuis/services/field';

const STORAGE_KEY = 'COLUMN_CONFIGURATION';

export default class ColumnConfigurationService extends Service {
  @tracked configuration = [];

  fields = [];
  context = null;

  initialize(fields, context) {
    this.fields = fields;
    this.context = context;
    this.revertConfiguration();
  }

  get storageKey() {
    return `${STORAGE_KEY}_${this.context}`;
  }

  @action
  revertConfiguration() {
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

  get columns() {
    const fields = this.selectedColumns
      .map((column) => this.fields.find((field) => field.key === column.key))
      .filter(Boolean);

    return fields
      .filter((field) => !isAttachedField(field))
      .map((field) => {
        return {
          ...field,
          attachedFields: Object.fromEntries(
            fields
              .filter(
                (attached) =>
                  attached.tooltipFor === field.key ||
                  attached.iconFor === field.key,
              )
              .map((attached) => [attached.key, true]),
          ),
        };
      });
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
  deselectColumn(key) {
    this.configuration = this.configuration.map((column) => {
      if (column.key !== key || column.isFixed) {
        return column;
      }

      return { ...column, isSelected: false };
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
    let storedConfiguration;

    try {
      storedConfiguration = JSON.parse(localStorage.getItem(this.storageKey));
    } catch {
      return null;
    }

    if (!Array.isArray(storedConfiguration)) {
      return null;
    }

    const storedColumns = new Map(
      storedConfiguration.map((column) => [column.key, column]),
    );

    const configuration = this.defaultConfiguration.map((column, index) => {
      const storedColumn = storedColumns.get(column.key);

      if (!storedColumn) {
        return { ...column, position: this.fields.length + index };
      }

      return {
        ...column,
        isSelected: column.isFixed || Boolean(storedColumn.isSelected),
        position: storedColumn.position ?? this.fields.length + index,
      };
    });

    return configuration
      .sort((a, b) => a.position - b.position)
      .map((column, index) => {
        return { ...column, position: index };
      });
  }

  @action
  saveConfiguration() {
    this.configuration = this.sortedConfiguration.map((column, index) => {
      return { ...column, position: index };
    });

    localStorage.setItem(this.storageKey, JSON.stringify(this.configuration));
  }
}
