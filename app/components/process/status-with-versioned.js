import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import {
  getCalculatedDifferences,
  isArrayDiverging,
  removedItemsWhenPropertyEquals,
} from '../../utils/versioning-comparison';

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

      const cleanedCurrentItems = removedItemsWhenPropertyEquals(
        currentItems,
        'isArchived',
        true,
      );
      const cleanedVersionedItems = removedItemsWhenPropertyEquals(
        versionedItems,
        'isArchived',
        true,
      );
      const { added, removed } = getCalculatedDifferences(
        cleanedCurrentItems,
        cleanedVersionedItems,
      );

      this.countAdded = added;
      this.countRemoved = removed;

      return isArrayDiverging(cleanedCurrentItems, cleanedVersionedItems);
    },
  );

  isListDiverging = trackedTask(this, this.calculatedCounts, () => [
    this.args.versionedItems,
    this.args.currentItems,
  ]);
}
