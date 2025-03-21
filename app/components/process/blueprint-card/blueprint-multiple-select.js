import Component from '@glimmer/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default class ProcessIcrCardBlueprintMultipleSelectComponent extends Component {
  @service store;

  @task
  *loadBlueprintProcessesTask(params) {
    const query = {
      filter: {
        'is-blueprint': true,
        title: params,
      },
    };

    return yield this.store.query('process', query).then(
      // fixme: frontend workaround because booleans are not interpreted correctly by the query
      (results) => results.filter((process) => process.isBlueprint === true)
    );
  }
}
