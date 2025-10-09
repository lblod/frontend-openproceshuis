import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryReplaceGroupModal extends Component {
  @service store;

  @tracked categoryOptions = A([]);
  @tracked newCategory;

  loadCategories = restartableTask(async () => {
    const categories = await this.store.query('process-category', {
      'filter[:exact:scheme]': ENV.conceptSchemes.processCategories,
    });

    this.categoryOptions.clear();
    this.categoryOptions.pushObjects(categories);
  });

  @action
  setNewProcessCategory({ model }) {
    console.log('new category', model);
  }
}
