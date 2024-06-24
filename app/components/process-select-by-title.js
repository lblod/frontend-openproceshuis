import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByTitleComponent extends Component {
  @service store;

  @restartableTask
  *loadProcessesTask(searchParams = '') {
    const query = {
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    if (searchParams.trim() !== '') {
      query['filter[name]'] = searchParams;
    }

    const result = yield this.store.query('file', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.name))];
    }
  }
}
