import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByGroupComponent extends Component {
  @service store;

  @restartableTask
  *loadGroupsTask(searchParams = '') {
    if (!searchParams?.trim()) return;

    yield timeout(200);

    const processQuery = {
      'filter[:not:status]': ENV.resourceStates.archived,
      include: 'publisher,relevant-administrative-units',
      page: { number: 0, size: 1000 }, //TODO: if OPH grows we should keep the size of this query in mind to prevent performance issues
    };

    if (this.args.classifications) {
      processQuery['filter[:or:][publisher][classification][:id:]'] =
        this.args.classifications;
      processQuery['filter[:or:][relevant-administrative-units][:id:]'] =
        this.args.classifications;
    }

    const processes = yield this.store.query('process', processQuery);

    const groupIds = new Set();

    processes.forEach((process) => {
      if (process.publisher) {
        groupIds.add(process.publisher.id);
      }
    });

    const groupQuery = {
      page: {
        size: 1000,
      },
      'filter[id]': Array.from(groupIds).join(','),
      sort: ':no-case:name',
    };

    if (searchParams) {
      groupQuery['filter[name]'] = searchParams;
    }

    const result = yield this.store.query('group', groupQuery);
    if (result) return [...new Set(result.map((r) => r.name))];
  }
}
