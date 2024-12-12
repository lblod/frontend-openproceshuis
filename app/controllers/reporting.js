import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ReportingController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';

  get reports() {
    return this.model.loadReportsTaskInstance.isFinished
      ? this.model.loadReportsTaskInstance.value
      : this.model.loadedReports;
  }

  get isLoading() {
    return this.model.loadReportsTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadReportsTaskInstance.isFinished &&
      this.reports?.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadReportsTaskInstance.isError;
  }

  @action
  resetFilters() {
    this.page = 0;
    this.sort = 'title';

    // Triggers a refresh of the model
    this.page = null;
  }
}
