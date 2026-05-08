import Component from '@glimmer/component';

export default class ProcessStatusWithVersioned extends Component {
  get postfixAdded() {
    return `${this.countOfCurrent} diagram${this.countOfCurrent === 1 ? '' : 'men'}`;
  }
  get postfixRemoved() {
    return `${this.countOfVersioned} diagram${this.countOfVersioned === 1 ? '' : 'men'}`;
  }

  get countOfCurrent() {
    return this.args.currentItems?.length || 0;
  }

  get countOfVersioned() {
    return this.args.versionedItems?.length || 0;
  }

  get isListDiverging() {
    const versions = this.args.versionedItems || [];
    const current = this.args.currentItems || [];

    return versions.some((item) => {
      const index = current.indexOf(item);
      return index === -1;
    });
  }
}
