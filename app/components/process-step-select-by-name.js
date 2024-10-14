import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepSelectByNameComponent extends Component {
  @service muSearch;

  @restartableTask
  *loadProcessStepsTask(searchValue = '') {
    if (!searchValue?.trim()) return;

    yield timeout(200);

    const page = 0;
    const size = 50;

    const filter = {};

    filter[':has:bpmn-process.bpmn-file.processes'] = 't';
    filter[':query:name'] = `*${searchValue}*`;

    const encodedArchivedUri = encodeURIComponent(
      ENV.resourceStates.archived.replaceAll('/', '\\/')
    );
    filter[
      ':query:bpmn-process.bpmn-file.status'
    ] = `NOT (${encodedArchivedUri})`;
    filter[
      ':query:bpmn-process.bpmn-file.processes.status'
    ] = `NOT (${encodedArchivedUri})`;

    const bpmnElements = yield this.muSearch.search({
      index: 'bpmn-elements',
      page,
      size,
      filters: filter,
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
