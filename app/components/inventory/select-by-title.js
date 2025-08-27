import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventorySelectByTitleComponent extends Component {
  @service store;

  @restartableTask
  *loadConceptualProcessesTask(searchParams = '') {
    if (!searchParams?.trim()) return;

    yield timeout(200);

    const query = {
      filter: {
        title: searchParams,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    const result = yield this.store.query('conceptual-process', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.title))];
    }
  }
}
