import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessStatusWithVersioned extends Component {
  @tracked countAdded = 0;
  @tracked countRemoved = 0;

  get currentItemsName() {
    if (this.countOfCurrent > 1) {
      return this.args.namePlural ?? 'items';
    }

    return this.args.nameSingular ?? 'item';
  }
  get versionItemsName() {
    if (this.countOfVersioned > 1) {
      return this.args.namePlural ?? 'items';
    }

    return this.args.nameSingular ?? 'item';
  }

  calculatedCounts = task(
    { restartable: true },
    async (versionedItems, currentItems) => {
      let _added = 0;
      let _removed = 0;
      const versions = [...(versionedItems ?? [])];
      const current = [...(currentItems ?? [])];

      const versionSet = new Set(versions);
      const currentSet = new Set(current);

      for (const item of current) {
        if (!versionSet.has(item)) {
          _added++;
        }
      }

      for (const item of versions) {
        if (!currentSet.has(item)) {
          _removed++;
        }
      }
      this.countAdded = _added;
      this.countRemoved = _removed;
      return this.countAdded >= 1 || this.countRemoved >= 1;
    },
  );

  isListDiverging = trackedTask(this, this.calculatedCounts, () => [
    this.args.versionedItems,
    this.args.currentItems,
  ]);
}
