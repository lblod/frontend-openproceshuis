import Route from '@ember/routing/route';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';
import { keepLatestTask, task } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnUploadsBpmnFileIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    let metadata = this.modelFor('bpmn-uploads.bpmn-file');

    let loadDiagramTaskInstance = this.loadDiagramTask.perform(metadata.id);
    let loadedDiagram = this.loadDiagramTask.lastSuccessful?.value;

    let loadBpmnElementsTaskInstance = this.loadBpmnElementsTask.perform(
      params,
      metadata.id
    );
    let loadedBpmnElements = this.loadBpmnElementsTask.lastSuccessful?.value;

    return {
      metadata,
      loadDiagramTaskInstance,
      loadedDiagram,
      loadBpmnElementsTaskInstance,
      loadedBpmnElements,
    };
  }

  @task
  *loadDiagramTask(id) {
    const url = generateBpmnDownloadUrl(id);
    const response = yield fetch(url);
    if (!response.ok) throw Error(response.status);
    return yield response.text();
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnElementsTask(params, fileId) {
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
