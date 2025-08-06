import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import {
  dropTask,
  keepLatestTask,
  restartableTask,
  timeout,
} from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessInventoryProcessCardPopup extends Component {
  @service store;
  @service toaster;
  @tracked selectedProcessConcept = undefined;
  @tracked filterTitle = undefined;
  @tracked filterCategory = undefined;
  @tracked filterDomain = undefined;
  @tracked filterGroup = undefined;
  @tracked filterNumber = undefined;

  size = 1000;

  constructor(...args) {
    super(...args);
    this.loadProcessConceptsTask.perform();
  }

  get process() {
    return this.args.process;
  }

  get isEditing() {
    return this.args.isEditing;
  }

  get linkedConcept() {
    return this.process.linkedConcept;
  }

  get processConcepts() {
    return this.loadProcessConceptsTask.lastSuccessful?.value;
  }

  get processCategories() {
    const categories = this.store.peekAll('process-category');
    if (!categories) {
      return [];
    }
    const categoryLabels = [...categories].map((category) => {
      return category.label;
    });
    return categoryLabels;
  }

  get processDomains() {
    const domains = this.store.peekAll('process-domain');
    if (!domains) {
      return [];
    }

    let filteredDomains = [...domains];

    if (this.filterCategory) {
      filteredDomains = filteredDomains.filter((domain) => {
        const categories =
          domain.processCategories || domain.get('processCategories');
        return (
          categories &&
          categories.some((category) => category.label === this.filterCategory)
        );
      });
    }
    return filteredDomains.map((domain) => domain.label);
  }

  get processGroups() {
    const groups = this.store.peekAll('process-group');
    if (!groups) {
      return [];
    }

    let filteredGroups = [...groups];

    if (this.filterDomain) {
      filteredGroups = filteredGroups.filter((group) => {
        const domains = group.processDomains || group.get('processDomains');
        return (
          domains &&
          domains.some((domain) => domain.label === this.filterDomain)
        );
      });
    } else if (this.filterCategory) {
      filteredGroups = filteredGroups.filter((group) => {
        const domains = group.processDomains || group.get('processDomains');
        if (!domains) return false;

        return domains.some((domain) => {
          const categories =
            domain.processCategories || domain.get('processCategories');
          return (
            categories &&
            categories.some(
              (category) => category.label === this.filterCategory,
            )
          );
        });
      });
    }
    return filteredGroups.map((group) => group.label);
  }

  get isLoading() {
    return this.loadProcessConceptsTask.isRunning;
  }

  get loadingMessage() {
    return 'Procesconcepten worden opgehaald ...';
  }

  get noResultsFound() {
    return (
      this.loadProcessConceptsTask.last?.isSuccessful &&
      this.loadProcessConceptsTask.last?.value.length === 0
    );
  }

  get saveButtonDisabled() {
    return !this.selectedProcessConcept;
  }

  @action
  resetModel() {
    this.process.rollbackAttributes();
    this.selectedProcessConcept = undefined;
    this.args.closeModal();
  }

  @action
  selectProcessConcept(processConcept) {
    this.selectedProcessConcept = processConcept;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    try {
      this.process.linkedConcept = this.selectedProcessConcept;
      yield this.process.save();
      this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
        timeOut: 5000,
      });
      this.args.closeModal();
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.updateModelFailed');
      this.toaster.error(errorMessage, 'Fout', { timeout: 5000 });
      this.resetModel();
    }
  }

  @keepLatestTask()
  *loadProcessConceptsTask() {
    let query = {
      reload: true,
      page: { size: this.size },
      sort: ':no-case:title',
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (this.filterTitle) {
      query['filter[title]'] = this.filterTitle;
    }

    if (this.filterCategory) {
      query[
        'filter[process-groups][process-domains][process-categories][label]'
      ] = this.filterCategory;
    }

    if (this.filterDomain) {
      query['filter[process-groups][process-domains][label]'] =
        this.filterDomain;
    }

    if (this.filterGroup) {
      query['filter[process-groups][label]'] = this.filterGroup;
    }

    if (this.filterNumber) {
      query['filter[:exact:number]'] = this.filterNumber;
    }

    return yield this.store.query('conceptual-process', query);
  }

  @action
  handleFilterChange() {
    this.searchTask.perform();
  }

  @action
  updateFilterTitle(event) {
    this.filterTitle = event.target.value;
    this.handleFilterChange();
  }

  @action
  updateFilterCategory(categoryLabel) {
    this.filterCategory = categoryLabel;
    this.filterDomain = undefined;
    this.filterGroup = undefined;
    this.handleFilterChange();
  }

  @action
  updateFilterDomain(domainLabel) {
    this.filterDomain = domainLabel;
    this.filterGroup = undefined;
    this.handleFilterChange();
  }

  @action
  updateFilterGroup(groupLabel) {
    this.filterGroup = groupLabel;
    this.handleFilterChange();
  }

  @action
  updateFilterNumber(event) {
    this.filterNumber = event.target.value;
    this.handleFilterChange();
  }

  @restartableTask
  *searchTask() {
    yield timeout(500);
    yield this.loadProcessConceptsTask.perform();
  }

  @action
  resetFilters() {
    this.filterTitle = undefined;
    this.filterCategory = undefined;
    this.filterDomain = undefined;
    this.filterGroup = undefined;
    this.filterNumber = undefined;

    this.handleFilterChange();
  }
}
