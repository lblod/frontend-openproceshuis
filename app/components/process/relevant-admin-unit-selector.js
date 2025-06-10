import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessRelevantAdminUnitSelectorComponent extends Component {
  @service router;
  @service store;

  loadProcessClassificationsTask = restartableTask(async () => {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
    };

    return await this.store.query(
      'administrative-unit-classification-code',
      query,
    );
  });

  relevantAdministrativeUnits = trackedTask(
    this,
    this.loadProcessClassificationsTask,
  );
}
