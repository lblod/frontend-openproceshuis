import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { service } from 'reactiveweb/resource/service';
import { action } from '@ember/object';

export default class InventoryIndexRoute extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @service router;

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

  @action
  addNewInventoryProcess() {
    console.log('add button pressed');
  }
}
