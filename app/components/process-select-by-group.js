import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class ProcessSelectByGroupComponent extends Component {
  @service store;

  @restartableTask
  *loadGroupsTask(searchParams = '') {
    if (!searchParams?.trim()) return;

    yield timeout(200);

    const query = {
      page: {
        size: 50,
      },
      'filter[:has:processes]': true,
      filter: {
        name: searchParams,
      },
      sort: ':no-case:name',
    };

    if (this.args.classification)
      query['filter[classification][:exact:label]'] = this.args.classification;

    const result = yield this.store.query('group', query);

    if (result) return [...new Set(result.map((r) => r.name))];
  }
}
