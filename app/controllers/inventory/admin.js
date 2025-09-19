import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { timeout } from 'ember-concurrency';

export default class InventoryAdminController extends Controller {
  @service store;
  @service toaster;
  @service router;

  @tracked isNewCategoryModalOpen = false;
  @tracked isNewDomainModalOpen = false;
  @tracked categoryToRefresh;
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

  @action
  scrollToCategory(category) {
    let element = document.getElementById(category.id);
    if (element) {
      const elementTop =
        element.getBoundingClientRect().top + window.pageYOffset;
      const elementHeight = element.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrollTo = elementTop - viewportHeight / 2 + elementHeight / 2;

      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });

      element.classList.add('highlight-section');
      setTimeout(() => {
        element.classList.remove('highlight-section');
      }, 1000);
    }
  }

  @action
  refreshCategories() {
    this.router.refresh();
  }

  @action
  async refreshDomainsForCategory() {
    this.categoryToRefresh = this.createForCategory;
    await timeout(25);
    this.categoryToRefresh = null;
    this.createForCategory = null;
    this.isNewDomainModalOpen = false;
  }
}
