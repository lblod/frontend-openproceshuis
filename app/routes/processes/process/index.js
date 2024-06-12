import Route from '@ember/routing/route';
import { keepLatestTask, waitForProperty } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    let {
      loadMetadataTaskInstance,
      loadedMetadata,
      loadDiagramTaskInstance,
      loadedDiagram,
    } = this.modelFor('processes.process');

    let loadProcessStepsTaskInstance = this.loadProcessStepsTask.perform(
      loadMetadataTaskInstance,
      params
    );
    let loadedProcessSteps = this.loadProcessStepsTask.lastSuccessful?.value;

    return {
      loadMetadataTaskInstance,
      loadedMetadata,
      loadDiagramTaskInstance,
      loadedDiagram,
      loadProcessStepsTaskInstance,
      loadedProcessSteps,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTask(loadMetadataTaskInstance, params) {
    yield waitForProperty(loadMetadataTaskInstance, 'isFinished');
    const fileId = loadMetadataTaskInstance.value.id;

    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'type',
      'filter[:has:name]': true,
      'filter[processes][derivations][id]': fileId,
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
