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
    const filter = {};

    filter[':has:bpmn-process.bpmn-file.processes'] = 't';
    if (params.name) filter[':query:name'] = `*${params.name}*`;
    if (params.type) filter[':term:type.key'] = params.type;

    const encodedArchivedUri = encodeURIComponent(
      ENV.resourceStates.archived.replaceAll('/', '\\/')
    );
    filter[
      ':query:bpmn-process.bpmn-file.status'
    ] = `NOT (${encodedArchivedUri})`;
    filter[
      ':query:bpmn-process.bpmn-file.processes.status'
    ] = `NOT (${encodedArchivedUri})`;

    let sort = null;

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');
      sort = isDescending ? params.sort.substring(1) : params.sort;

      if (sort === 'type') sort = 'type.label';
      else if (sort === 'file') sort = 'bpmn-process.bpmn-file.name';
      else if (sort === 'process')
        sort = 'bpmn-process.bpmn-file.processes.title';

      if (isDescending) sort = `-${sort}`;
    }

    return yield this.muSearch.search({
      index: 'bpmn-elements',
      page: params.page,
      size: params.size,
      sort: sort,
      filters: filter,
      dataMapping: (data) => {
        const entry = data.attributes;
        return {
          name: entry.name,
          type: {
            name: entry.type?.label,
          },
          bpmnProcess: {
            bpmnFile: {
              name: entry['bpmn-process']['bpmn-file'].name,
              process: {
                id: entry['bpmn-process']['bpmn-file'].processes?.uuid,
                title: entry['bpmn-process']['bpmn-file'].processes?.title,
              },
            },
          },
        };
      },
    });
  }
}
