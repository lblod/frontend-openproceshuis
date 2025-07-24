import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class InventoryIndexRoute extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';

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
}
