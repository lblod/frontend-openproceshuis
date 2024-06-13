import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model() {
    const { loadProcessTaskInstance, loadedProcess } =
      this.modelFor('processes.process');

    return {
      loadProcessTaskInstance,
      loadedProcess,
      loadFilesTaskInstance: this.loadFilesTask.perform(),
      loadedFiles: this.loadFilesTask.lastSuccessful?.value,
      loadProcessStepsTaskInstance: this.loadProcessStepsTask.perform(),
      loadedProcessSteps: this.loadProcessStepsTask.lastSuccessful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadFilesTask() {
    const { id: processId } = this.paramsFor('processes.process');
    const query = {
      'filter[:not:status]': ENV.resourceStates.archived,
      'filter[process][id]': processId,
    };
    return yield this.store.query('file', query);
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
