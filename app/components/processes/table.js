import Component from '@glimmer/component';

import { action } from '@ember/object';

export default class ProcessesTable extends Component {
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

  get modifiedSince() {
    return this.query.modifiedSince;
  }

  @action
  updateQuery(changes) {
    this.args.onQueryChange?.({
      ...this.query,
      ...changes,
    });
  }

  @action
  onPageChange(page) {
    this.page = page;
  }

  @action
  onSizeChange(size) {
    this.size = size;
  }

  @action
  onSortChange(sort) {
    this.sort = sort;
  }
}
