import Component from '@glimmer/component';

export default class ProcessStatusWithVersioned extends Component {
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

  get postfixAdded() {
    return `${this.countOfCurrent} ${this.currentItemsName}`;
  }
  get postfixRemoved() {
    return `${this.countOfVersioned} ${this.versionItemsName}`;
  }

  get countOfCurrent() {
    return this.args.currentItems?.length || 0;
  }

  get countOfVersioned() {
    return this.args.versionedItems?.length || 0;
  }

  get isListDiverging() {
    const versions = [...(this.args.versionedItems ?? [])];
    const current = [...(this.args.currentItems ?? [])];

    if (versions.length !== current.length) {
      return true;
    }

    return current.some((item) => {
      const index = versions.indexOf(item);
      return index === -1;
    });
  }
}
