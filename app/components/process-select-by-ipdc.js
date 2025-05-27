import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByClassificationComponent extends Component {
  @service router;
  @service store;

  loadProcessClassificationsTask = restartableTask(async () => {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:name',
    };

    const activeProcesses = await this.store.query('process', {
      'filter[:not:status]': ENV.resourceStates.archived,
      include: 'ipdc-products',
      page: { number: 0, size: 1000 }, //TODO: if OPH grows we should keep the size of this page in mind to prevent performance issues
    });

    const ipdcProductIds = new Set();
    activeProcesses.forEach((process) => {
      process.ipdcProducts.forEach((unit) => {
        ipdcProductIds.add(unit.id);
      });
    });

    query['filter[id]'] = Array.from(ipdcProductIds).join(',');

    return await this.store.query('ipdc-product', query);
  });

  ipdcProducts = trackedTask(this, this.loadProcessClassificationsTask);
}
