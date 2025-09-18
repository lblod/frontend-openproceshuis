import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class InventoryCreateDomainModal extends Component {
  @service store;
  @service toaster;

  @tracked label;

  get canSave() {
    return this.label && this.label.trim() !== '';
  }

  @action
  updateLabel(event) {
    this.label = event.target?.value;
  }

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
