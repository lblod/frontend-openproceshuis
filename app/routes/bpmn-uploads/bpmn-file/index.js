import Route from '@ember/routing/route';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';
import { keepLatestTask, task, waitForProperty } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnUploadsBpmnFileIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    let { loadMetadataTaskInstance, loadedMetadata } = this.modelFor(
      'bpmn-uploads.bpmn-file'
    );

    let loadDiagramTaskInstance = this.loadDiagramTask.perform(
      loadMetadataTaskInstance
    );
    let loadedDiagram = this.loadDiagramTask.lastSuccessful?.value;

    let loadBpmnElementsTaskInstance = this.loadBpmnElementsTask.perform(
      loadMetadataTaskInstance,
      params
    );
    let loadedBpmnElements = this.loadBpmnElementsTask.lastSuccessful?.value;

    return {
      loadMetadataTaskInstance,
      loadedMetadata,
      loadDiagramTaskInstance,
      loadedDiagram,
      loadBpmnElementsTaskInstance,
      loadedBpmnElements,
    };
  }

  @task
  *loadDiagramTask(loadMetadataTaskInstance) {
    yield waitForProperty(loadMetadataTaskInstance, 'isFinished');
    const fileId = loadMetadataTaskInstance.value.id;

    const url = generateBpmnDownloadUrl(fileId);
    const response = yield fetch(url);
    if (!response.ok) throw Error(response.status);
    return yield response.text();
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnElementsTask(loadMetadataTaskInstance, params) {
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
