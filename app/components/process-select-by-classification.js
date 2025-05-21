import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByClassificationComponent extends Component {
  @service router;
  @service store;

  loadClassificationsTask = restartableTask(async () => {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
    };

    const activeProcesses = await this.store.query('process', {
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

    return await this.store.query(
      'administrative-unit-classification-code',
      query,
    );
  });

  classifications = trackedTask(this, this.loadClassificationsTask);
}
