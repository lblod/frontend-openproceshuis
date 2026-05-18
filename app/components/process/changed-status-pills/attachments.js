import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessChangedStatusPillsAttachments extends Component {
  @tracked addedCount = 0;
  @tracked removedCount = 0;

  get postfixAdded() {
    return `${this.addedCount} bestand${this.addedCount === 1 ? '' : 'en'}`;
  }
  get postfixRemoved() {
    return `${this.removedCount} bestand${this.removedCount === 1 ? '' : 'en'}`;
  }

  calculate = task({ restartable: true }, async (_current, _older) => {
    if (!_current || !_older) {
      return { isDiverging: false };
    }

    const currentActiveItems = _current.filter((item) => !item.isArchived);

    const currentActiveIds = new Set(currentActiveItems.map((item) => item.id));
    const olderActiveIds = new Set(_older.map((item) => item.id));

    let added = 0;
    for (const id of currentActiveIds) {
      if (!olderActiveIds.has(id)) {
        added++;
      }
    }

    let removed = 0;
    for (const id of olderActiveIds) {
      if (!currentActiveIds.has(id)) {
        removed++;
      }
    }

    this.addedCount = added ?? 0;
    this.removedCount = removed ?? 0;

    return {
      isDiverging: this.addedCount > 0 || this.removedCount > 0,
      addedCount: this.addedCount,
      removedCount: this.removedCount,
    };
  });

  isDiverging = trackedTask(this, this.calculate, () => [
    this.args.current,
    this.args.versioned,
  ]);
}
