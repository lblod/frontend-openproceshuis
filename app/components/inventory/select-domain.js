import Component from '@glimmer/component';

import { service } from '@ember/service';
import { action } from '@ember/object';

import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventorySelectDomain extends Component {
  @service router;
  @service store;

  loadDomainsTask = restartableTask(async () => {
    const query = {
      page: {
        size: 100,
      },
      sort: ':no-case:label',
      filter: {
        scheme: ENV.conceptSchemes.processDomains,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    if (this.args.category)
      query['filter[process-categories][id]'] = this.args.category;

    return await this.store.query('process-domain', query);
  });

  domains = trackedTask(this, this.loadDomainsTask, () => [this.args.category]);

  loadSelectedDomain = restartableTask(async () => {
    if (!this.args.selected) return null;
    return await this.store.findRecord('process-domain', this.args.selected);
  });

  selectedDomain = trackedTask(this, this.loadSelectedDomain, () => [
    this.args.selected,
  ]);

  @action
  onChange(domain) {
    this.args.onChange?.({
      filterKey: 'domain',
      value: domain?.id,
    });
  }
}
