import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';

export default class BpmnFileSelectByNameComponent extends Component {
  @service store;

  @restartableTask *loadBpmnFilesTask(searchParams = '') {
    const query = {};

    if (searchParams.trim() !== '') {
      query.name = searchParams;
    }

    const result = yield this.store.query('bpmn-file', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.name))];
    }
  }
}
