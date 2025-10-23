import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { action } from '@ember/object';

import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventorySelectGroup extends Component {
  @service router;
  @service store;

  @tracked options = A([]);

  loadGroupsTask = restartableTask(async () => {
    const query = {
      page: {
        size: 500,
      },
      sort: ':no-case:label',
      filter: {
        scheme: ENV.conceptSchemes.processGroups,
      },
    };

    if (this.args.category)
      query['filter[process-domains][process-categories][id]'] =
        this.args.category;

    if (this.args.domain)
      query['filter[process-domains][id]'] = this.args.domain;
    this.options.clear();
    const options = await this.store.query('process-group', query);
    this.options.pushObjects(options);
  });

  groups = trackedTask(this, this.loadGroupsTask, () => [
    this.args.category,
    this.args.domain,
  ]);

  loadSelectedGroup = restartableTask(async () => {
    if (!this.args.selected) return null;
    return await this.store.findRecord('process-group', this.args.selected);
  });

  selectedGroup = trackedTask(this, this.loadSelectedGroup, () => [
    this.args.selected,
  ]);

  @action
  onChange(group) {
    this.args.onChange?.({
      filterKey: 'group',
      value: group?.id,
      model: group,
    });
  }
}
