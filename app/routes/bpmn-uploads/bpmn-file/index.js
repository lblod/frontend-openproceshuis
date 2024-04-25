import Route from '@ember/routing/route';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';

export default class BpmnUploadsBpmnFileIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    let metadata = this.modelFor('bpmn-uploads.bpmn-file');
    let diagram = await this.fetchBpmnXml(metadata.id);

    let loadBpmnElementsTaskInstance = await this.loadbpmnElementsTask.perform(
      params,
      metadata.id
    );
    let loadedBpmnElements = this.loadbpmnElementsTask.lastSuccessful?.value;

    return {
      metadata,
      diagram,
      loadBpmnElementsTaskInstance,
      loadedBpmnElements,
    };
  }

  async fetchBpmnXml(id) {
    const url = generateBpmnDownloadUrl(id);
    const response = await fetch(url);
    return await response.text();
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadbpmnElementsTask(params, fileId) {
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
