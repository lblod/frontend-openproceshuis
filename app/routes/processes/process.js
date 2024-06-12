import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';

export default class ProcessesProcessRoute extends Route {
  @service store;

  async model() {
    const { id } = this.paramsFor('processes.process');
    return {
      loadProcessTaskInstance: this.loadProcessTask.perform(id),
      loadedProcess: this.loadProcessTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessTask(processId) {
    return yield this.store.findRecord('process', processId, {
      include:
        'files,publisher,publisher.primary-site,publisher.primary-site.contacts',
    });
  }
}
