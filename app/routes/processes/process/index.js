import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model() {
    const {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
      loadAttachmentsTaskInstance,
      loadedAttachments,
    } = this.modelFor('processes.process');

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadBpmnFilesTaskInstance,
      loadedBpmnFiles,
      loadAttachmentsTaskInstance,
      loadedAttachments,
      loadProcessStepsTaskInstance: this.loadProcessStepsTask.perform(),
      loadedProcessSteps: this.loadProcessStepsTask.lastSuccessful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const params = this.paramsFor('processes.process.index');

    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'type',
      'filter[:has:name]': true,
      'filter[bpmn-process][bpmn-file][process][id]': processId,
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
