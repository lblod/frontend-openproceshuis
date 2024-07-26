import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessRoute extends Route {
  @service store;
  @service plausible;

  async model() {
    return {
      loadProcessTaskInstance: this.loadProcessTask.perform(),
      loadedProcess: this.loadProcessTask.lastSuccesful?.value,
      loadLatestBpmnFileTaskInstance: this.loadLatestBpmnFileTask.perform(),
      loadedLatestBpmnFile: this.loadLatestBpmnFileTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const query = {
      reload: true,
      include:
        'files,publisher,publisher.primary-site,publisher.primary-site.contacts',
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

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadLatestBpmnFileTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const query = {
      reload: true,
      page: {
        number: 0,
        size: 1,
      },
      'filter[processes][id]': processId,
      'filter[extension]': 'bpmn',
      sort: '-created',
    };

    const bpmnFiles = yield this.store.query('file', query);
    return bpmnFiles.length ? bpmnFiles[0] : undefined;
  }
}
