import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class InventoryAdminController extends Controller {
  @service store;
  @service toaster;

  @tracked isNewCategoryModalOpen = false;
  @tracked isNewDomainModalOpen = false;
  @tracked createForCategory;

  @action
  onCloseCreateDomainModal() {
    this.createForCategory = null;
    this.isNewDomainModalOpen = false;
  }

  @action
  openCreateDomainModal(categoryModel) {
    this.createForCategory = categoryModel;
    this.isNewDomainModalOpen = true;
  }
}
