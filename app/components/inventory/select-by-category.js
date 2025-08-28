import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByClassificationComponent extends Component {
  @service router;
  @service store;

  loadCategoriesTask = restartableTask(async () => {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
      filter: {
        scheme: ENV.conceptSchemes.processCategories,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    return await this.store.query('process-category', query);
  });

  categories = trackedTask(this, this.loadCategoriesTask);
}
