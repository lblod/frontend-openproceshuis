import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessChangedStatusPillsDiagrams extends Component {
  @tracked countAdded = 0;
  @tracked countRemoved = 0;

  get currentItemsName() {
    if (this.countOfCurrent > 1) {
      return 'diagrammen';
    }

    return 'diagram';
  }

  get versionItemsName() {
    if (this.countOfVersioned > 1) {
      return 'diagrammen';
    }

    return 'diagram';
  }

  calculatedCounts = task(
    { restartable: true },
    async (versionedItems, currentItems) => {
      if (!currentItems) {
        return false;
      }

      let _added = 0;
      let _removed = 0;

      console.log(
        'current diagrams',
        Array.from(currentItems).map((c) => ({
          id: c.id,
          isArchived: c.isArchived,
        })),
      );
      console.log(
        'versioned diagrams',
        Array.from(versionedItems).map((c) => ({
          id: c.id,
          isArchived: c.isArchived,
        })),
      );

      for (const currentItem of Array.from(currentItems)) {
        const isFoundInVersion = versionedItems.find(
          (v) => v.id === currentItem.id,
        );
        if (!isFoundInVersion) {
          _added++;
        }
      }
      for (const versionedItem of Array.from(versionedItems)) {
        const isFoundInCurrent = currentItems.find(
          (c) => c.id === versionedItem.id,
        );
        if (!isFoundInCurrent) {
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
