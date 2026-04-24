import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

import { task } from 'ember-concurrency';
import { trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessVersionSelector extends Component {
  @service store;

  fetchProcessVersions = task({ restartable: true }, async () => {
    if (!this.args.process) {
      return [];
    }

    const versions = await this.store.query('versioned-process', {
      'filter[canonical][id]': this.args.process.id,
      sort: '-created',
      page: {
        size: 20,
        number: 0,
      },
    });

    return [this.args.process, ...versions];
  });

  versions = trackedTask(this, this.fetchProcessVersions, () => [
    this.args.selected,
  ]);

  get selected() {
    return this.args.selected
      ? this.versions?.value?.find((v) => v.id == this.args.selected)
      : this.args.process;
  }

  @action
  onVersionChanged(process) {
    this.args.onSelected?.(process);
  }
}
