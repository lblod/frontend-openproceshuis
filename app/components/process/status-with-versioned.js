import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessStatusWithVersioned extends Component {
  @tracked countAdded = 0;
  @tracked countRemoved = 0;

  get currentItemsName() {
    if (this.countOfCurrent > 1) {
      return this.args.namePlural ?? '';
    }

    return this.args.nameSingular ?? '';
  }
  get versionItemsName() {
    if (this.countOfVersioned > 1) {
      return this.args.namePlural ?? '';
    }

    return this.args.nameSingular ?? '';
  }

  calculatedCounts = task(
    { restartable: true },
    async (versionedItems, currentItems) => {
      if (!currentItems) {
        return false;
      }

      let _added = 0;
      // Count all new items in current version
      const newItems = currentItems?.filter((current) => {
        const found = versionedItems.find(
          (versioned) => versioned.id === current.id,
        );

        return !found && !current.isArchived;
      });
      _added += newItems.length;

      this.countAdded = _added;
      return this.countAdded >= 1 || this.countRemoved >= 1;
    },
  );

  isListDiverging = trackedTask(this, this.calculatedCounts, () => [
    this.args.versionedItems,
    this.args.currentItems,
  ]);
}
