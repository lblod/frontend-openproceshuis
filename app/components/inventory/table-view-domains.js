import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryTableViewDomains extends Component {
  @service store;

  @tracked domains = A([]);

  constructor() {
    super(...arguments);
    this.store
      .query('process-domain', {
        'filter[process-categories][id]': this.args.category.id,
        sort: 'label',
        page: { size: 100 },
      })
      .then((domains) => this.domains.pushObjects(domains));
  }
}
