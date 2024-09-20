import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepsIndexRoute extends Route {
  @service store;
  @service muSearch;
  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    name: { refreshModel: true, replace: true },
    type: { refreshModel: true, replace: true },
  };

  async model(params) {
    return {
      loadProcessStepsTaskInstance: this.loadProcessStepsTask.perform(params),
      loadedProcessSteps: this.loadProcessStepsTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTask(params) {
    const muSearchBody = {
      from: params.page,
      size: params.size,
      query: {
        bool: {
          must: [
            { exists: { field: 'bpmn-process' } },
            { exists: { field: 'bpmn-process.bpmn-file' } },
            { exists: { field: 'bpmn-process.bpmn-file.processes' } },
          ],
          must_not: [
            {
              term: {
                'bpmn-process.bpmn-file.status':
                  'http://lblod.data.gift/concepts/concept-status/gearchiveerd',
              },
            },
            {
              term: {
                'bpmn-process.bpmn-file.processes.status':
                  'http://lblod.data.gift/concepts/concept-status/gearchiveerd',
              },
            },
          ],
        },
      },
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');
      let sortKey = isDescending ? params.sort.substring(1) : params.sort;

      if (sortKey === 'type') sortKey = 'type.label';
      else if (sortKey === 'file') sortKey = 'bpmn-process.bpmn-file.name';
      else if (sortKey === 'process')
        sortKey = 'bpmn-process.bpmn-file.processes.title';

      muSearchBody.sort = {
        [`${sortKey}.keyword`]: { order: isDescending ? 'desc' : 'asc' },
      };
    }

    if (params.name) {
      muSearchBody.query.bool.must.push({
        match_phrase: { name: params.name },
      });
    }

    if (params.type) {
      muSearchBody.query.bool.must.push({
        term: { ['type.key']: params.type },
      });
    }

    console.log(muSearchBody);

    //////////////////////////////

    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'type,bpmn-process.bpmn-file,bpmn-process.bpmn-file.processes',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;
      if (fieldName === 'file') fieldName = 'bpmn-process.bpmn-file.name';
      else if (fieldName === 'process')
        fieldName = 'bpmn-process.bpmn-file.processes.title';
      else if (fieldName === 'type') fieldName = 'type.label';
      else if (fieldName === 'name') query['filter[:has:name]'] = true; // Filtering with non-existent names, behaves unexpectedly

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    if (params.name) {
      query['filter[name]'] = params.name;
    }

    if (params.type) {
      query['filter[type][key]'] = params.type;
    }

    query['filter[:has:bpmn-process]'] = true;
    query['filter[bpmn-process][:has:bpmn-file]'] = true;
    query['filter[bpmn-process][bpmn-file][:not:status]'] =
      ENV.resourceStates.archived;
    query['filter[bpmn-process][bpmn-file][:has:processes]'] = true;
    query['filter[bpmn-process][bpmn-file][processes][:not:status]'] =
      ENV.resourceStates.archived;

    const results = yield this.store.query('bpmn-element', query);
    return !params.type
      ? results
      : results.filter(
          (element) => element.type.queryValue === params.type // TODO: Move exact matching to backend
        );
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadProcessStepsTaskMuSearch(params) {
    const filter = {};
    if (params.name) {
      let filterType = 'phrase_prefix';
      let name = params.name.trim();

      filter[`:${filterType}:name`] = name;
    }
    if (params.type) {
      filter['type']['key'] = params.type; // TODO: Check whether this is correct
    }
    let sort = null;
    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      let fieldName = isDescending ? params.sort.substring(1) : params.sort;
      if (fieldName === 'file') fieldName = 'processes.name';
      else if (fieldName === 'name') filter[':has:name'] = 't'; // Filtering with non-existent names, behaves unexpectedly

      sort = `${fieldName}`;
      if (isDescending) sort = `-${sort}`;
    }

    return yield this.muSearch.search({
      index: 'process-steps',
      page: params.page,
      size: params.size,
      sort,
      filters: filter,
      dataMapping: (data) => {
        const entry = data.attributes;
        const obj = {
          name: entry.name,
          id: entry.uuid,
          type: Array.isArray(entry.classification)
            ? entry.classification
                .map((c) =>
                  c.replace(
                    'https://www.irit.fr/recherches/MELODI/ontologies/BBO#',
                    ''
                  )
                )
                .join(', ')
            : entry.classification?.replace(
                'https://www.irit.fr/recherches/MELODI/ontologies/BBO#',
                ''
              ),
          process: {
            bpmnFile: {
              name: entry.processes?.name,
              created: entry.processes?.created,
              modified: Array.isArray(entry.processes?.modified)
                ? entry.processes.modified[0]
                : entry.processes?.modified,
              id: entry.processes?.fileId,
            },
          },
        };

        return obj;
      },
    });
  }
}
