import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class ConfigurableColumnsSelectColumns extends Component {
  @service('field') fieldService;

  @tracked searchFieldValue;

  get fieldCategories() {
    const fieldsByCategory = new Map();

    for (const field of this.fieldService.availableFields) {
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
}
