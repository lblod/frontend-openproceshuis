import Route from '@ember/routing/route';
import { task, keepLatestTask, waitForProperty } from 'ember-concurrency';
import { service } from '@ember/service';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    const { loadProcessTaskInstance, loadedProcess } =
      this.modelFor('processes.process');

    const loadBpmnFileTaskInstance = this.loadBpmnFileTask.perform(
      loadProcessTaskInstance
    );
    const loadedBpmnFile = this.loadBpmnFileTask.lastSuccessful?.value;

    const loadProcessStepsTaskInstance = this.loadProcessStepsTask.perform(
      loadProcessTaskInstance,
      params
    );
    const loadedProcessSteps = this.loadProcessStepsTask.lastSuccessful?.value;

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFileTaskInstance,
      loadedBpmnFile,
      loadProcessStepsTaskInstance,
      loadedProcessSteps,
    };
  }

  @task
  *loadBpmnFileTask(loadProcessTaskInstance) {
    yield waitForProperty(loadProcessTaskInstance, 'isFinished');

    const bpmnFileId = loadProcessTaskInstance.value.bpmnFile?.id;
    if (!bpmnFileId) return;

    const url = generateBpmnDownloadUrl(bpmnFileId);
    const response = yield fetch(url, {
      headers: {
        Accept: 'text/xml',
      },
    });
    if (!response.ok) throw Error(response.status);
    return yield response.text();
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTask(loadProcessTaskInstance, params) {
    yield waitForProperty(loadProcessTaskInstance, 'isFinished');

    const bpmnFileId = loadProcessTaskInstance.value.bpmnFile?.id;
    if (!bpmnFileId) return;

    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'type',
      'filter[:has:name]': true,
      'filter[process][bpmn-file][id]': bpmnFileId,
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;
      if (fieldName === 'type') fieldName = 'type.label';

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    return yield this.store.query('bpmn-element', query);
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.resetModel();
  }
}
