import Component from '@glimmer/component';

export default class ProcessChangedStatusPillsAttachments extends Component {
  get postfixAdded() {
    return `${this.countOfCurrent} bestand${this.countOfCurrent === 1 ? '' : 'en'}`;
  }
  get postfixRemoved() {
    return `${this.countOfVersioned} bestand${this.countOfVersioned === 1 ? '' : 'en'}`;
  }

  get countOfCurrent() {
    return this.args.current?.length || 0;
  }

  get countOfVersioned() {
    return this.args.versioned?.length || 0;
  }

  get isListDiverging() {
    const versions = this.args.versioned || [];
    const current = this.args.current || [];

    return versions.some((item) => {
      const index = current.indexOf(item);
      return index === -1;
    });
  }
}
