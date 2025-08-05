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
    const domainLabels = [...domains].map((domain) => {
      return domain.label;
    });
    return domainLabels;
  }

  get processGroups() {
    const groups = this.store.peekAll('process-group');
    if (!groups) {
      return [];
    }
    const groupLabels = [...groups].map((group) => {
      return group.label;
    });
    return groupLabels;
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
    console.log('this.selectedProcessConcept', this.selectedProcessConcept);
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
  mockOnchange() {
    console.log('on change called');
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
    this.handleFilterChange();
  }

  @action
  updateFilterDomain(domainLabel) {
    this.filterDomain = domainLabel;
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
