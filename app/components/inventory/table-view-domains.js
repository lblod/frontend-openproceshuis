import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryTableViewDomains extends Component {
  @service store;

  @tracked domains = A([]);
  @tracked isLoading = false;

  constructor() {
    super(...arguments);
    this.isLoading = true;
    this.store
      .query('process-domain', {
        'filter[process-categories][id]': this.args.category.id,
        sort: 'label',
        page: { size: 100 },
      })
      .then((domains) => {
        this.isLoading = false;
        this.domains.pushObjects(domains);
      });
  }
}
