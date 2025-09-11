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

  get isEditModalOpen() {
    return Boolean(this.processToEdit);
  }

  get isDeleteModalOpen() {
    return Boolean(this.processToDelete);
  }

  @action
  setCategory(selection) {
    this.page = null;
    this.category = selection;
  }

  @action
  setDomain(selection) {
    this.page = null;
    this.domain = selection;
  }

  @action
  setGroup(selection) {
    this.page = null;
    this.group = selection;
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

  @action
  openAddModal() {
    this.processToEdit = this.store.createRecord('conceptual-process');
  }

  @action
  openEditModal(process) {
    this.processToEdit = process;
  }

  @action
  openDeleteModal(process) {
    this.processToDelete = process;
  }

  @action
  closeEditModal() {
    if (this.processToEdit?.isNew) this.processToEdit.destroyRecord();
    this.processToEdit = null;
  }

  @action
  closeDeleteModal() {
    this.processToDelete = null;
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
  *saveInventoryProcess(process) {
    if (!process) return;

    const isNewProcess = process.isNew;

    try {
      process.modified = new Date();
      if (isNewProcess) {
        process.created = new Date();
        process.number = yield this.calculatedNewProcessNumber.perform();
      }
      yield process.save();

      this.toaster.success(
        isNewProcess
          ? 'Proces succesvol bewerkt'
          : 'Proces succesvol toegevoegd',
        'Gelukt!',
        { timeOut: 5000 },
      );

      this.closeEditModal();
      this.router.refresh('inventory.index');
    } catch (error) {
      const msg = getMessageForErrorCode(
        isNewProcess ? 'oph.updateModelFailed' : 'oph.addProcessFailed',
      );
      this.toaster.error(msg, 'Fout', { timeOut: 5000 });
      process.rollbackAttributes();
      this.closeEditModal();
    }
  }

  @keepLatestTask
  *calculatedNewProcessNumber() {
    try {
      const processes = yield this.store.query('conceptual-process', {
        sort: '-number',
        page: { size: 1 },
      });
      return processes[0]?.number + 1;
    } catch (e) {
      console.error('Error fetching latest process number:', e);
      return null;
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

    // Triggers a refresh of the model
    this.page = null;
  }
}
