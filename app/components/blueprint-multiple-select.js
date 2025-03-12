import Component from '@glimmer/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default class BlueprintMultipleSelectComponent extends Component {
  @service store;

  @task
  *loadBlueprintProcessesTask(params) {
    const query = {
      filter: {
        title: params,
        'is-blueprint': true,
      },
    };

    return yield this.store.query('process', query);
  }
}
