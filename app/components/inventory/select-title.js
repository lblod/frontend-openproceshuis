import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { restartableTask, timeout } from 'ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventorySelectTitle extends Component {
  @service store;

  @tracked options = A([]);

  @restartableTask
  *loadConceptualProcessesTask(searchParams = '') {
    yield timeout(200);

    const query = {
      filter: {
        ':not:status': ENV.resourceStates.archived,
      },
    };
    this.options.clear();
    if (
      searchParams &&
      typeof searchParams === 'string' &&
      searchParams?.trim() !== ''
    ) {
      query['filter']['title'] = searchParams;
      this.options.pushObject(searchParams);
    }
    if (this.args.category)
      query['filter[process-groups][process-domains][process-categories][id]'] =
        this.args.category;

    if (this.args.domain)
      query['filter[process-groups][process-domains][id]'] = this.args.domain;

    if (this.args.group) query['filter[process-groups][id]'] = this.args.group;

    const result = yield this.store.query('conceptual-process', query);

    if (result) {
      this.options.pushObjects([...new Set(result.map((r) => r.title))]);
    }
  }

  @action
  onChange(title) {
    this.args.onChange?.({
      filterKey: 'processTitle',
      value: title,
    });
  }
}
