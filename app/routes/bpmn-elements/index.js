import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import { InvertedBpmnElementTypes } from '../../utils/bpmn-element-types';

export default class BpmnElementsIndexRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    name: { refreshModel: true, replace: true },
    type: { refreshModel: true, replace: true },
  };

  async model(params) {
    return {
      loadBpmnFilesTaskInstance: this.loadbpmnElementsTask.perform(params),
      loadedBpmnFiles: this.loadbpmnElementsTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadbpmnElementsTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'processes.derivations',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;
      if (fieldName === 'file') fieldName = 'processes.derivations.name';
      else if (fieldName === 'name') query['filter[:has:name]'] = 'true'; // Filtering with non-existent names, behaves unexpectedly

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.name) {
      query['filter[name]'] = params.name;
    }

    if (!params.type) {
      return yield this.store.query('bpmn-element', query);
    }

    const elementType = InvertedBpmnElementTypes[params.type] || undefined;
    if (elementType)
      query[
        'filter[classification]'
      ] = `https://www.irit.fr/recherches/MELODI/ontologies/BBO#${elementType}`;

    return yield this.store.query('bpmn-element', query);
  }
}
