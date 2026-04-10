import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ProcessOverviewComponent extends Component {
  get filters() {
    return this.args.filters ?? [];
  }

  get columns() {
    return this.args.columns ?? [];
  }

  get query() {
    return this.args.query ?? {};
  }

  get loadProcessesTaskInstance() {
    return this.args.model?.loadProcessesTaskInstance;
  }

  get processes() {
    return this.loadProcessesTaskInstance?.isFinished
      ? this.loadProcessesTaskInstance.value
      : this.args.model?.loadedProcesses;
  }

  get isLoading() {
    return this.loadProcessesTaskInstance?.isRunning ?? false;
  }

  get hasNoResults() {
    return (
      this.loadProcessesTaskInstance?.isFinished && this.processes?.length === 0
    );
  }

  get hasErrored() {
    return this.loadProcessesTaskInstance?.isError ?? false;
  }

  get page() {
    return this.query.page;
  }

  set page(page) {
    this.updateQuery({ page });
  }

  get size() {
    return this.query.size;
  }

  set size(size) {
    this.updateQuery({ size });
  }

  get sort() {
    return this.query.sort;
  }

  set sort(sort) {
    this.updateQuery({ sort });
  }

  get title() {
    return this.query.title ?? '';
  }

  get classifications() {
    return this.query.classifications;
  }

  get selectedClassifications() {
    return this.query.selectedClassifications;
  }

  get group() {
    return this.query.group ?? '';
  }

  get creator() {
    return this.query.creator ?? '';
  }

  get blueprint() {
    return this.query.blueprint ?? false;
  }

  get ipdcProducts() {
    return this.query.ipdcProducts;
  }

  get selectedIpdcProducts() {
    return this.query.selectedIpdcProducts;
  }

  get showBlueprintFilter() {
    return this.filters.includes('blueprint');
  }

  get showTitleFilter() {
    return this.filters.includes('title');
  }

  get showClassificationFilter() {
    return this.filters.includes('classification');
  }

  get showGroupFilter() {
    return this.filters.includes('group');
  }

  get showCreatorFilter() {
    return this.filters.includes('creator');
  }

  get showIpdcFilter() {
    return this.filters.includes('ipdc');
  }

  get showTitleColumn() {
    return this.columns.includes('title');
  }

  get showDescriptionColumn() {
    return this.columns.includes('description');
  }

  get showModifiedColumn() {
    return this.columns.includes('modified');
  }

  get showClassificationColumn() {
    return this.columns.includes('classification');
  }

  get showOrganizationColumn() {
    return this.columns.includes('organization');
  }

  get showCreatorColumn() {
    return this.columns.includes('creator');
  }

  @action
  updateQuery(changes) {
    this.args.onQueryChange?.({
      ...this.query,
      ...changes,
    });
  }

  @action
  setTitle(selection) {
    this.updateQuery({
      page: null,
      title: selection,
    });
  }

  @action
  setClassifications(selection) {
    this.updateQuery({
      page: null,
      selectedClassifications: selection,
      classifications: selection.length
        ? selection.map((classification) => classification.id).join(',')
        : undefined,
    });
  }

  @action
  setGroup(selection) {
    this.updateQuery({
      page: null,
      group: selection,
    });
  }

  @action
  setCreator(selection) {
    this.updateQuery({
      page: null,
      creator: selection,
    });
  }

  @action
  toggleBlueprintFilter(checked) {
    this.updateQuery({
      page: null,
      blueprint: checked,
    });
  }

  @action
  setIpdcProducts(selection) {
    this.updateQuery({
      page: null,
      selectedIpdcProducts: selection,
      ipdcProducts: selection.length
        ? selection.map((ipdcProduct) => ipdcProduct.id).join(',')
        : undefined,
    });
  }

  @action
  resetFilters() {
    const resetQuery = {
      ...this.query,
      page: null,
      sort: 'title',
    };

    if (this.showTitleFilter) resetQuery.title = '';
    if (this.showBlueprintFilter) resetQuery.blueprint = false;
    if (this.showClassificationFilter) {
      resetQuery.classifications = undefined;
      resetQuery.selectedClassifications = undefined;
    }
    if (this.showGroupFilter) resetQuery.group = '';
    if (this.showCreatorFilter) resetQuery.creator = '';
    if (this.showIpdcFilter) {
      resetQuery.ipdcProducts = undefined;
      resetQuery.selectedIpdcProducts = undefined;
    }

    this.args.onQueryChange?.(resetQuery);
  }
}
