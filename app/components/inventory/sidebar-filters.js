import Component from '@glimmer/component';

import { action } from '@ember/object';

export default class InventorySidebarFilters extends Component {
  queryParams = ['category', 'domain', 'group', 'processTitle'];

  @action
  resetFilters() {
    const emptyParams = {};
    for (const key of this.queryParams) {
      emptyParams[key] = null;
    }
    this.args.onFilterApplied(emptyParams);
  }

  @action
  onFilterUpdated({ filterKey, value }) {
    this.args.onFilterApplied({ [filterKey]: value });
  }
}
