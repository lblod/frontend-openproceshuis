import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { restartableTask, timeout } from 'ember-concurrency';

export default class InventoryCreateDomainModal extends Component {
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
      const duplicates = await this.store.query('process-domain', {
        'filter[process-categories][id]': this.args.category.id,
        'filter[:exact:label]': this.label.trim(),
        page: { size: 1 },
      });
      if (duplicates.length !== 0) {
        this.errorMessage = 'Dit domein bestaat al';
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
      const domainModel = await this.store.createRecord('process-domain', {
        label: this.label.trim(),
        created: datetimeNow,
        modified: datetimeNow,
        processCategories: [this.args.category],
      });
      await domainModel.save();
      this.toaster.success('Domein toegevoegd', undefined, {
        timeOut: 5000,
      });
      this.args.onCloseModal?.();
      this.label = null;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanmaken van het domein',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  }
}
