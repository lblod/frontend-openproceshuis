import Route from '@ember/routing/route';
import { keepLatestTask } from 'ember-concurrency';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepsIndexRoute extends Route {
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
                'bpmn-process.bpmn-file.status': ENV.resourceStates.archived,
              },
            },
            {
              term: {
                'bpmn-process.bpmn-file.processes.status':
                  ENV.resourceStates.archived,
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
        query_string: {
          query: `*${params.name}*`,
          fields: ['name'],
          default_operator: 'AND',
        },
      });
    }

    if (params.type) {
      muSearchBody.query.bool.must.push({
        term: { ['type.key']: params.type },
      });
    }

    return yield this.muSearch.searchDsl({
      index: 'bpmn-elements',
      page: params.page,
      size: params.size,
      body: muSearchBody,
      dataMapping: (data) => {
        const entry = data.attributes;
        return {
          name: entry.name,
          type: {
            name: entry.type.label,
          },
          bpmnProcess: {
            bpmnFile: {
              name: entry['bpmn-process']['bpmn-file'].name,
              process: {
                id: entry['bpmn-process']['bpmn-file'].processes.uuid,
                title: entry['bpmn-process']['bpmn-file'].processes.title,
              },
            },
          },
        };
      },
    });
  }
}
