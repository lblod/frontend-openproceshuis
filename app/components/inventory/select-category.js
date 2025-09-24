import Component from '@glimmer/component';

import { service } from '@ember/service';
import { action } from '@ember/object';

import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventorySelectCategory extends Component {
  @service router;
  @service store;

  loadCategoriesTask = restartableTask(async () => {
    const query = {
      sort: ':no-case:label',
      filter: {
        scheme: ENV.conceptSchemes.processCategories,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    return await this.store.query('process-category', query);
  });

  categories = trackedTask(this, this.loadCategoriesTask);

  loadSelectedCategory = restartableTask(async () => {
    if (!this.args.selected) return null;
    return await this.store.findRecord('process-category', this.args.selected);
  });

  selectedCategory = trackedTask(this, this.loadSelectedCategory, () => [
    this.args.selected,
  ]);

  @action
  onChange(category) {
    this.args.onChange(category?.id);
  }
}
