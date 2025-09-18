import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryCollapsibleDomainTable extends Component {
  @service store;

  @tracked groups = A([]);
  @tracked isLoading = false;
  @tracked isCollapsed = false;

  constructor() {
    super(...arguments);
    this.isCollapsed = !!this.args.isCollapsedOnLoad;
    if (!this.isCollapsed) {
      this.loadGroups();
    }
  }

  @action
  async toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    if (!this.isCollapsed) {
      await this.loadGroups();
    }
  }

  async loadGroups() {
    this.isLoading = true;
    this.groups = await this.store.query('process-group', {
      'filter[process-domains][id]': this.args.domain.id,
      sort: 'label',
      page: { size: 100 },
    });
    this.isLoading = false;
  }
}
