import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency';
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

    const usableGroupsSet = new Set();
    const usableDomainsSet = new Set();
    const usableCategoriesSet = new Set();

    [...allConceptualProcesses].forEach((process) => {
      const group = process.processGroup;
      if (group && !group.isArchived) {
        usableGroupsSet.add(group);
        const domain = group.processDomain;
        if (domain && !domain.isArchived) {
          usableDomainsSet.add(domain);
          const category = domain.processCategory;
          if (category && !category.isArchived) {
            usableCategoriesSet.add(category);
          }
        }
      }
    });

    this.groups = [...usableGroupsSet];
    this.domains = [...usableDomainsSet];
    this.categories = [...usableCategoriesSet];
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
    this.processDomain = process.processGroup.get('processDomain');
    this.processCategory = process.processGroup.get(
      'processDomain.processCategory',
    );

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
    const hasTitle = this.title && this.title.trim() !== '';
    const hasGroup = !!this.processGroup;
    const hasDomain = !!this.processDomain;
    const hasCategory = !!this.processCategory;

    return hasTitle && hasGroup && hasDomain && hasCategory;
  }

  @action
  setTitle(event) {
    this.title = event.target.value;
    if (this.currentProcess) {
      this.currentProcess.title = this.title;
    }
  }

  @action
  handleProcessCategoryChange(selectedCategory) {
    if (selectedCategory) {
      this.addProcessModalEdited = true;
    }
    this.processCategory = selectedCategory;
    this.processDomain = undefined;
    this.processGroup = undefined;

    if (this.currentProcess) {
      this.currentProcess.processGroups = [];
    }
  }

  @action
  handleProcessDomainChange(selectedDomain) {
    this.processDomain = selectedDomain;
    if (selectedDomain) {
      this.addProcessModalEdited = true;
      this.processCategory = selectedDomain.processCategory;
      this.processGroup = undefined;
    } else {
      this.processGroup = undefined;
    }

    if (this.currentProcess) {
      this.currentProcess.processGroups = [];
    }
  }

  @action
  async handleProcessGroupChange(selectedGroup) {
    this.processGroup = selectedGroup;
    if (selectedGroup) {
      this.addProcessModalEdited = true;
      this.processDomain = selectedGroup.processDomain;
      this.processCategory = selectedGroup.processDomain.processCategory;
    }

    if (this.currentProcess) {
      this.currentProcess.processGroups = selectedGroup ? [selectedGroup] : [];
    }
  }

  @action
  closeModal() {
    if (this.currentProcess && this.currentProcess.isNew) {
      this.currentProcess.destroyRecord();
    }
    this.isModalOpen = false;
    this.currentProcess = undefined;
    this.reset();
  }

  @keepLatestTask
  *saveInventoryProcess() {
    if (!this.formIsValid) {
      return;
    }

    this.currentProcess.title = this.title;
    this.currentProcess.processGroups = [this.processGroup];
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
      this.reset();
    }
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
    this.processCategory = undefined;
    this.processDomain = undefined;
    this.processGroup = undefined;
  }
}
