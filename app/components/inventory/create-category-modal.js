import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class InventoryCreateCategoryModal extends Component {
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
