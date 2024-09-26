import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepSelectByNameComponent extends Component {
  @service muSearch;

  @restartableTask
  *loadProcessStepsTask(searchValue = '') {
    if (!searchValue?.trim()) return;

    const page = 0;
    const size = 50;

    const muSearchBody = {
      from: page,
      size,
      query: {
        bool: {
          must: [
            { exists: { field: 'bpmn-process' } },
            { exists: { field: 'bpmn-process.bpmn-file' } },
            { exists: { field: 'bpmn-process.bpmn-file.processes' } },
            {
              query_string: {
                query: `*${searchValue}*`,
                fields: ['name'],
                default_operator: 'AND',
              },
            },
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

    const bpmnElements = yield this.muSearch.searchDsl({
      index: 'bpmn-elements',
      page: page,
      size,
      body: muSearchBody,
      dataMapping: (data) => {
        const entry = data.attributes;
        return {
          name: entry.name,
        };
      },
    });

    if (bpmnElements) {
      return [...[searchValue], ...new Set(bpmnElements.map((r) => r.name))];
    }
  }
}
