import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryCollapsibleDomainTable extends Component {
  @service store;

  @tracked groups = A([]);
  @tracked isCollapsed = false;

  constructor() {
    super(...arguments);
    this.isCollapsed = !!this.args.isCollapsedOnLoad;
    this.store
      .query('process-group', {
        'filter[process-domains][id]': this.args.domain.id,
        sort: 'label',
        page: { size: 100 },
      })
      .then((groups) => this.groups.pushObjects(groups));
  }

  @action
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
