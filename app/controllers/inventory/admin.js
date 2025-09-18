import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class InventoryAdminController extends Controller {
  @service store;
  @service toaster;

  @tracked isNewCategoryModalOpen = false;
  @tracked newCategoryLabel;

  get canSaveNewCategory() {
    return this.newCategoryLabel && this.newCategoryLabel.trim() !== '';
  }

  @action
  openCategoryModal() {
    this.isNewCategoryModalOpen = true;
    this.newCategoryLabel = null;
  }

  @action
  updateCategoryLabel(event) {
    this.newCategoryLabel = event.target?.value;
  }

  @action
  async createCategory() {
    try {
      const datetimeNow = new Date();
      const categoryModel = await this.store.createRecord('process-category', {
        label: this.newCategoryLabel.trim(),
        created: datetimeNow,
        modified: datetimeNow,
      });
      await categoryModel.save();
      this.toaster.success('Categorie toegevoegd', undefined, {
        timeOut: 5000,
      });
      this.newCategoryLabel = null;
      this.isNewCategoryModalOpen = false;
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
