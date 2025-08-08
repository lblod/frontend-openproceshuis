import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryIndexController extends Controller {
  @service store;
  queryParams = ['page', 'size', 'sort'];
  @service router;
  @service currentSession;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';

  @tracked addProcessRowOpened = false;
  @tracked addProcessRowEdited = false;
  @tracked processCategory;
  @tracked processDomain;
  @tracked processGroup;
  @tracked newProcessId;
  @tracked categories = [];
  @tracked domains = [];
  @tracked groups = [];

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
    const latestProcessId = await this.findLatestProcessNumberTask.perform();

    if (typeof latestProcessId === 'number') {
      this.newProcessId = latestProcessId + 1;
    } else {
      this.newProcessId = null;
    }

    this.addProcessRowOpened = true;
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

  @action
  handleProcessCategoryChange(selectedCategory) {
    if (selectedCategory) {
      this.addProcessRowEdited = true;
    }
    this.processCategory = selectedCategory;
    this.processDomain = undefined;
    this.processGroup = undefined;
  }

  @action
  handleProcessDomainChange(selectedDomain) {
    this.processDomain = selectedDomain;
    if (selectedDomain) {
      this.addProcessRowEdited = true;
      this.processCategory = selectedDomain.processCategory;
      this.processGroup = undefined;
    } else {
      this.processGroup = undefined;
    }
  }

  @action
  handleProcessGroupChange(selectedGroup) {
    this.processGroup = selectedGroup;
    if (selectedGroup) {
      this.addProcessRowEdited = true;
      this.processDomain = selectedGroup.processDomain;
      this.processCategory = selectedGroup.processDomain.processCategory;
    }
  }

  @action
  closeAddProcessRow() {
    this.addProcessRowOpened = false;
    this.clearSelections();
  }

  @action
  clearSelections() {
    this.processCategory = undefined;
    this.processDomain = undefined;
    this.processGroup = undefined;
    this.addProcessRowEdited = false;
  }
}
