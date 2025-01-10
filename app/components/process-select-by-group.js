import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';

export default class ProcessSelectByGroupComponent extends Component {
  @service store;

  @restartableTask
  *loadGroupsTask(searchParams = '') {
    const query = {
      page: {
        size: 50,
      },
    };

    if (searchParams.trim() !== '') query['filter[name]'] = searchParams;

    if (this.args.classification)
      query['filter[classification][:exact:label]'] = this.args.classification;

    const result = yield this.store.query('group', query);

    if (result) return [...new Set(result.map((r) => r.name))];
  }
}
