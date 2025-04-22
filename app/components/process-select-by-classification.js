import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ProcessSelectByClassificationComponent extends Component {
  @service router;
  @service store;

  @tracked classifications = [];

  @restartableTask
  *loadProcessClassificationsTask() {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
    };

    query['filter[:has:processes]'] = true;

    const result = yield this.store.query(
      'administrative-unit-classification-code',
      query
    );
    this.classifications = result;
  }
}
