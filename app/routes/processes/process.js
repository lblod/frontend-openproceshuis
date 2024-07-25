import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask, waitForProperty } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessRoute extends Route {
  @service store;
  @service plausible;

  async model() {
    const loadProcessTaskInstance = this.loadProcessTask.perform();
    const loadedProcess = this.loadProcessTask.lastSuccesful?.value;

    const loadBpmnFilesTaskInstance = this.loadBpmnFilesTask.perform(
      loadProcessTaskInstance
    );
    const loadedBpmnFiles = this.loadBpmnFilesTask.lastSuccessful?.value;

    const loadLatestBpmnFileTaskInstance =
      this.loadLatestBpmnFileTask.perform();
    const loadedLatestBpmnFile =
      this.loadLatestBpmnFileTask.lastSuccesful?.value;

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
      loadLatestBpmnFileTaskInstance,
      loadedLatestBpmnFile,
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
  *loadBpmnFilesTask(loadProcessTaskInstance) {
    yield waitForProperty(loadProcessTaskInstance, 'isFinished');

    const files = loadProcessTaskInstance.value?.files;
    return files
      ?.filter((file) => file.isBpmnFile)
      .sort((fileA, fileB) => fileB.created - fileA.created); // FIXME: should be handled by backend
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadLatestBpmnFileTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const query = {
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
