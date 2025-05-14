import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import ENV from 'frontend-openproceshuis/config/environment';

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

    const activeProcesses = yield this.store.query('process', {
      'filter[:not:status]': ENV.resourceStates.archived,
      include: 'relevant-administrative-units',
      page: { number: 0, size: 1000 }, //TODO: if OPH grows we should keep the size of this page in mind to prevent performance issues
    });

    const classificationIds = new Set();
    activeProcesses.forEach((process) => {
      process.relevantAdministrativeUnits.forEach((unit) => {
        classificationIds.add(unit.id);
      });
    });

    query['filter[id]'] = Array.from(classificationIds).join(',');

    const result = yield this.store.query(
      'administrative-unit-classification-code',
      query,
    );

    this.classifications = result;
  }
}
