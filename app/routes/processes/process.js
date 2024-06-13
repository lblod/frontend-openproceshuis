import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';

export default class ProcessesProcessRoute extends Route {
  @service store;

  async model() {
    return {
      loadProcessTaskInstance: this.loadProcessTask.perform(),
      loadedProcess: this.loadProcessTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessTask() {
    const { id: processId } = this.paramsFor('processes.process');
    return yield this.store.findRecord('process', processId, {
      include:
        'publisher,publisher.primary-site,publisher.primary-site.contacts',
    });
  }
}
