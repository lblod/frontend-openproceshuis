import Route from '@ember/routing/route';
import { keepLatestTask, waitForProperty, timeout } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    pageProcessSteps: { as: 'process-steps-page', refreshModel: true },
    sizeProcessSteps: { as: 'process-steps-size', refreshModel: true },
    sortProcessSteps: { as: 'process-steps-sort', refreshModel: true },
  };

  async model() {
    const { id: processId } = this.paramsFor('processes.process');

    const {
      loadProcessTaskInstance,
      loadedProcess,
      loadLatestBpmnFileTaskInstance,
      loadedLatestBpmnFile,
    } = this.modelFor('processes.process');

    return {
      processId,
      loadProcessTaskInstance,
      loadedProcess,
      loadLatestBpmnFileTaskInstance,
      loadedLatestBpmnFile,
      loadProcessStepsTaskInstance: this.loadProcessStepsTask.perform(
        loadLatestBpmnFileTaskInstance
      ),
      loadedProcessSteps: this.loadProcessStepsTask.lastSuccessful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTask(loadLatestBpmnFileTaskInstance) {
    yield waitForProperty(loadLatestBpmnFileTaskInstance, 'isFinished');

    const latestBpmnFileId = loadLatestBpmnFileTaskInstance.value?.id;
    if (!latestBpmnFileId) return;

    while (true) {
      const query = {
        'filter[:exact:resource]': `http://mu.semte.ch/services/file-service/files/${latestBpmnFileId}`,
        sort: '-modified',
      };
      const jobs = yield this.store.query('job', query);

      if (jobs.length === 0) break;

      const jobStatus = jobs[0].status;
      if (jobStatus === ENV.jobStates.success) break;

      if (
        jobStatus === ENV.jobStates.failed ||
        jobStatus === ENV.jobStates.canceled
      )
        return;

      yield timeout(1000);
    }

    const params = this.paramsFor('processes.process.index');

    const query = {
      page: {
        number: params.pageProcessSteps,
        size: params.sizeProcessSteps,
      },
      include: 'type',
      'filter[:has:name]': true,
      'filter[bpmn-process][bpmn-file][id]': latestBpmnFileId,
    };

    if (params.sortProcessSteps) {
      const isDescending = params.sortProcessSteps.startsWith('-');

      let fieldName = isDescending
        ? params.sortProcessSteps.substring(1)
        : params.sortProcessSteps;
      if (fieldName === 'type') fieldName = 'type.label';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    return yield this.store.query('bpmn-element', query);
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.reset();
  }
}
