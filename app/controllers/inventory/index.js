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

  @tracked addProcessModalOpened = false;
  @tracked addProcessModalEdited = false;
  @tracked processCategory;
  @tracked processDomain;
  @tracked processGroup;
  @tracked newProcessId;
  @tracked title = '';
  @tracked categories = [];
  @tracked domains = [];
  @tracked groups = [];
  @tracked conceptualProcess = undefined;

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
    if (this.categories.length === 0) {
      await this.prepareDropdownData.perform();
    }

    this.addProcessModalOpened = true;
    this.conceptualProcess = this.store.createRecord('conceptual-process');
    const latestProcessId = await this.findLatestProcessNumberTask.perform();

    if (typeof latestProcessId === 'number') {
      this.newProcessId = latestProcessId + 1;
    } else {
      this.newProcessId = null;
    }
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
    if (this.conceptualProcess) {
      this.conceptualProcess.title = this.title;
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

    if (this.conceptualProcess) {
      this.conceptualProcess.processGroups = [];
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

    if (this.conceptualProcess) {
      this.conceptualProcess.processGroups = [];
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

    if (this.conceptualProcess) {
      this.conceptualProcess.processGroups = selectedGroup
        ? [selectedGroup]
        : [];
    }
  }

  @action
  closeAddProcessModal() {
    if (this.conceptualProcess && this.conceptualProcess.isNew) {
      this.conceptualProcess.destroyRecord();
    }
    this.addProcessModalOpened = false;
    this.clearSelections();
  }

  @keepLatestTask
  *saveInventoryProcess() {
    if (!this.formIsValid) {
      return;
    }

    try {
      if (!this.conceptualProcess.created)
        this.conceptualProcess.created = new Date();
      this.conceptualProcess.modified = new Date();
      this.conceptualProcess.number = this.newProcessId;

      yield this.conceptualProcess.save();
      this.closeAddProcessModal();
      this.router.refresh('inventory.index');
      this.toaster.success('Proces succesvol toegevoegd', 'Gelukt!', {
        timeOut: 5000,
      });
    } catch (error) {
      const errorMessage = getMessageForErrorCode('oph.addProcessFailed');
      this.toaster.error(errorMessage, 'Fout', {
        timeOut: 5000,
      });
      console.error('Error while saving conceptual process:', error);
      this.conceptualProcess.rollbackAttributes();
    }
  }

  @action
  clearSelections() {
    this.processCategory = undefined;
    this.processDomain = undefined;
    this.processGroup = undefined;
    this.title = '';
    this.addProcessModalEdited = false;
  }
}
