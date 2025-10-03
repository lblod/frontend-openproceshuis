import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryTableViewDomains extends Component {
  @service store;

  @tracked domains = A([]);

  constructor() {
    super(...arguments);
    this.fetchDomains.perform();
  }

  fetchDomains = restartableTask(async () => {
    const domains = await this.store.query('process-domain', {
      'filter[process-categories][id]': this.args.category.id,
      'filter[:exact:scheme]': ENV.conceptSchemes.processDomains,
      sort: 'label',
      page: { size: 100 },
    });
    this.domains.clear();
    this.domains.pushObjects(domains);
  });
}
