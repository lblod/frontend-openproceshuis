import Route from '@ember/routing/route';
import { keepLatestTask, waitForProperty } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    pageProcessSteps: { as: 'process-steps-page', refreshModel: true },
    sizeProcessSteps: { as: 'process-steps-size', refreshModel: true },
    sortProcessSteps: { as: 'process-steps-sort', refreshModel: true },
    pageVersions: { as: 'versions-page', refreshModel: true },
    sizeVersions: { as: 'versions-size', refreshModel: true },
    sortVersions: { as: 'versions-sort', refreshModel: true },
    pageAttachments: { as: 'attachments-page', refreshModel: true },
    sizeAttachments: { as: 'attachments-size', refreshModel: true },
    sortAttachments: { as: 'attachments-sort', refreshModel: true },
  };

  async model() {
    const {
      loadProcessTaskInstance,
      loadedProcess,
      loadLatestBpmnFileTaskInstance,
      loadedLatestBpmnFile,
    } = this.modelFor('processes.process');

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance: this.loadBpmnFilesTask.perform(),
      loadedBpmnFiles: this.loadBpmnFilesTask.lastSuccessful?.value,
      loadAttachmentsTaskInstance: this.loadAttachmentsTask.perform(),
      loadedAttachments: this.loadAttachmentsTask.lastSuccessful?.value,
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

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnFilesTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const params = this.paramsFor('processes.process.index');

    const query = {
      page: {
        number: params.pageVersions,
        size: params.sizeVersions,
      },
      'filter[processes][id]': processId,
      'filter[extension]': 'bpmn',
    };

    if (params.sortVersions) {
      const isDescending = params.sortVersions.startsWith('-');

      let sortValue = isDescending
        ? params.sortVersions.substring(1)
        : params.sortVersions;

      if (sortValue === 'name') sortValue = `:no-case:${sortValue}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    return yield this.store.query('file', query);
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadAttachmentsTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const params = this.paramsFor('processes.process.index');

    const query = {
      page: {
        number: params.pageAttachments,
        size: params.sizeAttachments,
      },
      'filter[processes][id]': processId,
      'filter[:not:extension]': 'bpmn',
    };

    if (params.sortAttachments) query.sort = params.sortAttachments;

    return yield this.store.query('file', query);
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.resetModel();
  }
}
