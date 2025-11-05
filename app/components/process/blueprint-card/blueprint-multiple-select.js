import Component from '@glimmer/component';

import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { restartableTask } from 'ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessIcrCardBlueprintMultipleSelectComponent extends Component {
  @service store;

  @tracked processes = A([]);

  loadBlueprintProcessesTask = restartableTask(async (params) => {
    const query = {
      filter: {
        'is-blueprint': true,
        ':not:status': ENV.resourceStates.archived,
      },
      sort: 'title',
    };

    if (params && typeof params === 'string' && params.trim() !== '') {
      query.filter.title = params;
    }

    const processes = await this.store.query('process', query);
    this.processes.clear();
    this.processes.pushObjects(processes);
  });
}
