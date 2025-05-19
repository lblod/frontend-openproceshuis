import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class RelevantAdminUnitSelector extends Component {
  @service router;
  @service store;

  @tracked relevantAdministrativeUnits = [];

  @restartableTask
  *loadProcessClassificationsTask() {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
    };

    const result = yield this.store.query(
      'administrative-unit-classification-code',
      query,
    );
    this.relevantAdministrativeUnits = result;
  }
}
