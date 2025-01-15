import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;
  @service plausible;

  async model() {
    const { id: processId } = this.paramsFor('processes.process');

    return {
      processId,
      loadProcessTaskInstance: this.loadProcessTask.perform(),
      loadedProcess: this.loadProcessTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask
  *loadProcessTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const query = {
      reload: true,
      include:
        'files,publisher,publisher.primary-site,publisher.primary-site.contacts,publisher.classification,ipdc-products',
      'filter[files][:not:status]': ENV.resourceStates.archived,
    };

    const process = yield this.store.findRecord('process', processId, query);

    this.plausible.trackEvent('Raadpleeg proces', {
      'Proces-ID': process?.id,
      Procesnaam: process?.title,
      'Bestuur-ID': process?.publisher?.id,
      Bestuursnaam: process?.publisher?.name,
    });

    return process;
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.reset();
    controller.fetchLatestBpmnFile.perform();
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.reset();
  }
}
