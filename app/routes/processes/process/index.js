import Route from '@ember/routing/route';
import { keepLatestTask, waitForProperty } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    pageProcessSteps: { as: 'processtappen-pagina', refreshModel: true },
    sizeProcessSteps: { as: 'processtappen-aantal', refreshModel: true },
    sortProcessSteps: { as: 'processtappen-sorteer', refreshModel: true },
    pageVersions: { as: 'versies-pagina', refreshModel: true },
    sizeVersions: { as: 'versies-aantal', refreshModel: true },
    sortVersions: { as: 'versies-sorteer', refreshModel: true },
    pageAttachments: { as: 'bijlagen-pagina', refreshModel: true },
    sizeAttachments: { as: 'bijlagen-aantal', refreshModel: true },
    sortAttachments: { as: 'bijlagen-sorteer', refreshModel: true },
  };

  async model() {
    const {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
      loadAttachmentsTaskInstance,
      loadedAttachments,
      loadLatestBpmnFileTaskInstance,
      loadedLatestBpmnFile,
    } = this.modelFor('processes.process');

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
      loadAttachmentsTaskInstance,
      loadedAttachments,
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

    let query = {
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
    controller.resetModel();
  }
}
