import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ProcessVersionSelector extends Component {
  @service store;
  @service toaster;

  @tracked versions = A([]);

  constructor() {
    super(...arguments);
    this.fetchProcessVersions.perform();
  }

  get versionOptions() {
    return [this.args.process, ...this.versions];
  }

  fetchProcessVersions = task({ restartable: true }, async () => {
    this.versions.clear();
    if (!this.args.process) {
      return [];
    }

    try {
      const versions = await this.store.query('versioned-process', {
        'filter[canonical][id]': this.args.process.id,
        sort: '-created',
        page: {
          size: 20,
          number: 0,
        },
      });
      this.versions.pushObjects([...versions]);
      this.versions.shift();
    } catch (error) {
      this.toaster.error('Fout tijdens het ophalen van proces versies', 'Fout');
    }
  });

  get selected() {
    return this.args.selectedId
      ? this.versions?.find((v) => v.id == this.args.selectedId)
      : this.args.process;
  }

  @action
  onVersionChanged(process) {
    this.args.onSelected?.(process);
  }
}
