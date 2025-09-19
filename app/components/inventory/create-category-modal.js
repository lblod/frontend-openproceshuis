import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { restartableTask, timeout } from 'ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryCreateCategoryModal extends Component {
  @service store;
  @service toaster;

  @tracked label;
  @tracked errorMessage;

  get canSave() {
    return this.label && this.label.trim() !== '' && !this.errorMessage;
  }

  updateLabel = restartableTask(async (event) => {
    this.label = event.target?.value;
    await timeout(250);
    if (this.label) {
      this.errorMessage = null;
      const duplicates = await this.store.query('process-category', {
        'filter[:exact:label]': this.label.trim(),
        'filter[:exact:scheme]': ENV.conceptSchemes.processCategories,
        page: { size: 1 },
      });
      if (duplicates.length !== 0) {
        this.errorMessage = 'Deze categorie bestaat al';
      } else {
        this.errorMessage = null;
      }
    } else {
      this.errorMessage = 'Dit veld is verplicht';
    }
  });

  @action
  async create() {
    try {
      const datetimeNow = new Date();
      const categoryModel = await this.store.createRecord('process-category', {
        label: this.label.trim(),
        created: datetimeNow,
        modified: datetimeNow,
      });
      await categoryModel.save();
      this.toaster.success('Categorie toegevoegd', undefined, {
        timeOut: 5000,
      });
      this.args.onCloseModal?.();
      this.label = null;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanmaken van de categorie',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  }
}
