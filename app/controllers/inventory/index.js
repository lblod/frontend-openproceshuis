import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask, dropTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class InventoryIndexController extends Controller {
  @service store;
  @service router;
  @service currentSession;
  @service toaster;

  queryParams = [
    'page',
    'size',
    'sort',
    'category',
    'domain',
    'group',
    'title',
    'number',
  ];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';
  @tracked category = '';
  @tracked domain = '';
  @tracked group = '';
  @tracked title = '';
  @tracked number = '';

  @tracked selectedCategory = null;

  @tracked processToAdd = null;
  @tracked processToEdit = null;
  @tracked processToDelete = null;

  get conceptualProcesses() {
    return this.model.loadConceptualProcessesTaskInstance.isFinished
      ? this.model.loadConceptualProcessesTaskInstance.value
      : this.model.loadedConceptualProcesses;
  }

  get isLoading() {
    return this.model.loadConceptualProcessesTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadConceptualProcessesTaskInstance.isFinished &&
      this.conceptualProcesses?.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadConceptualProcessesTaskInstance.isError;
  }

  @action
  setCategory(selection) {
    this.page = null;
    this.selectedCategory = selection;
    this.category = selection?.id;
  }

  @action
  setTitle(selection) {
    this.page = null;
    this.title = selection;
  }

  @action
  setNumber(event) {
    this.page = null;
    this.number = event.target.value;
  }

  get isEditing() {
    return Boolean(this.processToEdit);
  }
  get currentProcess() {
    return this.processToEdit ?? this.processToAdd ?? null;
  }
  get isModalOpen() {
    return Boolean(this.currentProcess);
  }
  get isDeleteModalOpen() {
    return Boolean(this.processToDelete);
  }

  @action
  async addNewInventoryProcess() {
    const record = this.store.createRecord('conceptual-process');

    const latest = await this.findLatestProcessNumberTask.perform();
    record.number = typeof latest === 'number' ? latest + 1 : null;

    this.processToAdd = record;
  }

  @action
  editInventoryProcess(process) {
    this.processToEdit = process;
  }

  @action
  openDeleteModal(process) {
    this.processToDelete = process;
  }

  @action
  closeModal() {
    if (this.processToAdd?.isNew) {
      this.processToAdd.destroyRecord();
    }
    this.processToAdd = null;
    this.processToEdit = null;
  }

  @action
  closeDeleteModal() {
    this.processToDelete = null;
  }

  @keepLatestTask
  *findLatestProcessNumberTask() {
    try {
      const res = yield this.store.query('conceptual-process', {
        sort: '-number',
        page: { size: 1 },
      });
      const process = [...res];
      return process[0]?.number;
    } catch (e) {
      console.error('Error fetching latest process number:', e);
      return null;
    }
  }

  @dropTask
  *deleteInventoryProcess() {
    try {
      this.processToDelete.status = ENV.resourceStates.archived;
      yield this.processToDelete.save();
      this.router.refresh('inventory.index');
      this.toaster.success('Proces succesvol verwijderd.', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      const msg = getMessageForErrorCode('oph.processDeletionError');
      this.toaster.error(msg, 'Fout', { timeOut: 5000 });
    } finally {
      this.closeDeleteModal();
    }
  }

  @keepLatestTask
  *saveInventoryProcess(record) {
    try {
      record.modified = new Date();
      if (record.isNew) record.created = new Date();

      yield record.save();

      this.toaster.success(
        this.isEditing
          ? 'Proces succesvol bewerkt'
          : 'Proces succesvol toegevoegd',
        'Gelukt!',
        { timeOut: 5000 },
      );
      this.closeModal();
      this.router.refresh('inventory.index');
    } catch (error) {
      const msg = getMessageForErrorCode(
        this.isEditing ? 'oph.updateModelFailed' : 'oph.addProcessFailed',
      );
      this.toaster.error(msg, 'Fout', { timeOut: 5000 });
      record.rollbackAttributes();
      this.closeModal();
    }
  }

  @action
  resetFilters() {
    this.page = 0;
    this.sort = 'title';
    this.category = '';
    this.domain = '';
    this.group = '';
    this.title = '';
    this.number = '';

    this.selectedCategory = null;

    // Triggers a refresh of the model
    this.page = null;
  }
}
