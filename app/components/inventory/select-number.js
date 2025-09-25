import Component from '@glimmer/component';

import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class InventorySelectNumber extends Component {
  @service router;
  @service store;

  onChange = restartableTask(async (event) => {
    await timeout(250);
    this.args.onChange?.({
      filterKey: 'processNumber',
      value: event.target?.value?.trim(),
    });
  });
}
