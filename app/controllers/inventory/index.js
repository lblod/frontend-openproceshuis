import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask, dropTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class InventoryIndexController extends Controller {
  @service store;
  queryParams = ['page', 'size', 'sort'];
  @service router;
  @service currentSession;
  @service toaster;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';

  @tracked isModalOpen = false;
  @tracked isDeleteModalOpen = false;
  @tracked processToDelete = undefined;
  @tracked addProcessModalEdited = false;
  @tracked processCategory;
  @tracked processDomain;
  @tracked processGroup;
  @tracked newProcessId;
  @tracked title = '';
  @tracked categories = [];
  @tracked domains = [];
  @tracked groups = [];
  @tracked currentProcess = undefined;

  constructor() {
    super(...arguments);
    this.prepareDropdownData.perform();
  }

  get conceptualProcesses() {
    return this.model.loadConceptualProcessesTaskInstance.isFinished
      ? this.model.loadConceptualProcessesTaskInstance.value
      : this.model.loadedConceptualProcesses;
  }

  get showResetButton() {
    if (this.currentProcess?.isNew) {
      return this.addProcessModalEdited;
    }

    if (this.isEditing) {
      return this.addProcessModalEdited;
    }

    return false;
  }

  get isLoading() {
    return this.model.loadConceptualProcessesTaskInstance.isRunning;
  }

  get isEditing() {
    return this.currentProcess && !this.currentProcess.isNew;
  }

  get hasNoResults() {
    return (
      this.model.loadConceptualProcessesTaskInstance.isFinished &&
      this.conceptualProcesses?.length === 0
    );
  }

  get canSave() {
    return (
      this.formIsValid &&
      (this.currentProcess?.isNew || this.addProcessModalEdited)
    );
  }

  get hasErrored() {
    return this.model.loadConceptualProcessesTaskInstance.isError;
  }

  @keepLatestTask
  *prepareDropdownData() {
    const allConceptualProcesses = yield this.store.query(
      'conceptual-process',
      {
        include:
          'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
        filter: {
          ':not:status': ENV.resourceStates.archived,
        },
        page: { size: 2000 },
      },
    );

    const availableGroups = new Set();
    const availableDomains = new Set();
    const availableCategories = new Set();

    for (const process of allConceptualProcesses) {
      const group = process.processGroup;
      if (!group || group.isArchived) continue;
      availableGroups.add(group);

      const domain = group.processDomain;
      if (!domain || domain.isArchived) continue;
      availableDomains.add(domain);

      const category = domain.processCategory;
      if (!category || category.isArchived) continue;
      availableCategories.add(category);
    }

    this.groups = [...availableGroups];
    this.domains = [...availableDomains];
    this.categories = [...availableCategories];
  }

  get availableDomains() {
    if (this.processGroup) {
      return [this.processGroup.processDomain];
    }
    if (this.processCategory) {
      return this.domains.filter(
        (domain) =>
          domain.processCategory?.get('id') === this.processCategory.id,
      );
    }
    return this.domains;
  }

  get availableGroups() {
    const filteredDomains = this.availableDomains;
    if (this.processDomain) {
      return this.groups.filter(
        (group) => group.processDomain?.get('id') === this.processDomain.id,
      );
    }

    if (this.processCategory) {
      const domainIds = filteredDomains.map((d) => d.id);
      return this.groups.filter((group) =>
        domainIds.includes(group.processDomain?.get('id')),
      );
    }
    return this.groups;
  }

  @action
  async addNewInventoryProcess() {
    this.reset();
    if (this.categories.length === 0) {
      await this.prepareDropdownData.perform();
    }

    this.isModalOpen = true;
    this.currentProcess = this.store.createRecord('conceptual-process');

    const latestProcessId = await this.findLatestProcessNumberTask.perform();
    this.currentProcess.number =
      typeof latestProcessId === 'number' ? latestProcessId + 1 : null;
  }

  @action
  editInventoryProcess(process) {
    this.currentProcess = process;
    this.title = process.title;
    this.processGroup = process.processGroup;
    const domain = process.processGroup.get('processDomain');
    this.processDomain = domain;
    this.processCategory = domain?.processCategory;

    this.addProcessModalEdited = true;
    this.isModalOpen = true;
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
    } catch (error) {
      console.error('Error fetching latest process number:', error);
      return null;
    }
  }

  get formIsValid() {
    return (
      this.title?.trim() &&
      this.processGroup &&
      this.processDomain &&
      this.processCategory
    );
  }

  @action
  setTitle(event) {
    this.title = event.target.value;
    if (this.currentProcess) {
      this.currentProcess.title = this.title;
    }
    if (!this.currentProcess.isNew) {
      this.addProcessModalEdited = true;
    }
  }

  @action
  updateProcessHierarchy({ category, domain, group }) {
    if (category) {
      this.processCategory = category;
      this.processDomain = undefined;
      this.processGroup = undefined;
      this.addProcessModalEdited = true;
    }
    if (domain) {
      this.processDomain = domain;
      this.processCategory = domain?.processCategory;
      this.processGroup = undefined;
      this.addProcessModalEdited = true;
    }
    if (group) {
      this.processGroup = group;
      this.processDomain = group?.processDomain;
      this.processCategory = group?.processDomain?.processCategory;
      this.addProcessModalEdited = true;
      if (this.currentProcess) {
        this.currentProcess.processGroups = group ? [group] : [];
      }
    }
  }

  @action
  handleProcessCategoryChange(selectedCategory) {
    this.updateProcessHierarchy({ category: selectedCategory });
  }

  @action
  handleProcessDomainChange(selectedDomain) {
    this.updateProcessHierarchy({ domain: selectedDomain });
  }

  @action
  handleProcessGroupChange(selectedGroup) {
    this.updateProcessHierarchy({ group: selectedGroup });
  }

  @action
  closeModal() {
    if (this.currentProcess && this.currentProcess.isNew) {
      this.currentProcess.destroyRecord();
    }
    this.reset();
  }

  @action
  openDeleteModal(process) {
    this.processToDelete = process;
    this.isDeleteModalOpen = true;
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
      const errorMessage = getMessageForErrorCode('oph.processDeletionError');
      this.toaster.error(errorMessage, 'Fout', { timeOut: 5000 });
    } finally {
      this.closeModal();
    }
  }

  @keepLatestTask
  *saveInventoryProcess() {
    if (!this.formIsValid) {
      return;
    }

    this.currentProcess.title = this.title;
    this.currentProcess.modified = new Date();

    if (this.currentProcess.isNew) {
      this.currentProcess.created = new Date();
    }

    try {
      yield this.currentProcess.save();

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
      const errorMessage = getMessageForErrorCode(
        this.isEditing ? 'oph.updateModelFailed' : 'oph.addProcessFailed',
      );
      this.toaster.error(errorMessage, 'Fout', { timeOut: 5000 });

      this.currentProcess.rollbackAttributes();
      this.closeModal();
    }
  }

  @action
  downloadProcesses() {
    alert('download processes WIP');
  }

  @action
  clearSelections() {
    this.processCategory = undefined;
    this.processDomain = undefined;
    this.processGroup = undefined;
    this.addProcessModalEdited = false;
  }

  reset() {
    this.currentProcess = undefined;
    this.title = '';
    this.clearSelections();
    this.processToDelete = undefined;
    this.isDeleteModalOpen = false;
    this.isModalOpen = false;
    this.addProcessModalEdited = false;
  }
}
