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
    let loadingTimeout;
    new Promise((resolve) => {
      console.log('start');
      loadingTimeout = setTimeout(() => {
        this.isLoading = true;
        console.log(`loading set to true`);
        resolve();
      }, 50);
    });

    this.groups = await this.store.query('process-group', {
      'filter[process-domains][id]': this.args.domain.id,
      sort: 'label',
      page: { size: 100 },
    });
    clearTimeout(loadingTimeout);
    this.isLoading = false;
  }
}
