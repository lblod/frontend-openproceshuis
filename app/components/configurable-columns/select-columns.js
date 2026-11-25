import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class ConfigurableColumnsSelectColumns extends Component {
  @service('field') fieldService;
  @service('column-configuration') columnConfigurationService;

  @tracked searchFieldValue = '';

  get availableFields() {
    return this.fieldService.availableFieldsFor(this.args.context);
  }

  get matchingFields() {
    const query = this.searchFieldValue?.trim().toLowerCase();

    if (!query) {
      return this.availableFields;
    }

    return this.availableFields.filter((field) => {
      return field.label.toLowerCase().includes(query);
    });
  }

  get fieldCategories() {
    const fieldsByCategory = new Map();

    for (const field of this.matchingFields) {
      if (!fieldsByCategory.has(field.category)) {
        fieldsByCategory.set(field.category, []);
      }

      fieldsByCategory.get(field.category).push(field);
    }

    return Array.from(fieldsByCategory, ([label, fields]) => {
      return {
        label,
        name: `select-columns-${label.toLowerCase().replace(/\s+/g, '-')}`,
        fields,
      };
    });
  }

  get selectedColumns() {
    return this.columnConfigurationService.configuration
      .filter((column) => column.isSelected)
      .map((column) => column.key);
  }

  get areAllColumnsSelected() {
    return this.columnConfigurationService.areAllColumnsSelected;
  }

  @action
  updateSearchFieldValue(event) {
    this.searchFieldValue = event.target?.value;
  }

  @action
  toggleAllColumns() {
    this.columnConfigurationService.toggleAllColumns();
  }

  @action
  updateSelectedColumns(selectedKeys) {
    this.columnConfigurationService.setSelectedColumns(selectedKeys);
  }
}
