import Controller from '@ember/controller';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class InventoryIndexController extends Controller {
  @service store;
  queryParams = [
    'page',
    'size',
    'sort',
    'category',
    'domain',
    'group',
    'title',
    'processTitle',
    'processNumber',
  ];
  @service router;
  @service currentSession;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked category = null;
  @tracked domain = null;
  @tracked group = null;
  @tracked processTitle = null;
  @tracked processNumber = null;

  @tracked isUpsertModalOpen = false;
  @tracked isDeleteModalOpen = false;
  @tracked isDownloadModalOpen = false;
  @tracked process;

  get conceptualProcesses() {
    return this.model.loadConceptualProcessesTaskInstance.isFinished
      ? this.model.loadConceptualProcessesTaskInstance.value
      : this.model.loadedConceptualProcesses;
  }

  @action
  openUpsertModal(process) {
    this.process = process;
    this.isUpsertModalOpen = true;
  }

  @action
  onProcessSaved() {
    this.onCloseUpsertModal();
    this.router.refresh('inventory.index');
  }

  @action
  onCloseUpsertModal() {
    this.isUpsertModalOpen = false;
    this.process = null;
  }

  @action
  openDeleteModal(process) {
    this.process = process;
    this.isDeleteModalOpen = true;
  }

  @action
  onProcessDeleted() {
    this.onCloseDeleteModal();
    this.router.refresh('inventory.index');
  }

  @action
  onCloseDeleteModal() {
    this.isDeleteModalOpen = false;
    this.process = null;
  }

  @action
  updateFilters(filters) {
    Object.entries(filters).map(([key, value]) => {
      this[key] = value;
    });
    this.page = 0;
  }
}
