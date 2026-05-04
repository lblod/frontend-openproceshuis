import Component from '@glimmer/component';

export default class ProcessStatusWithVersioned extends Component {
  get postfixAdded() {
    return `${this.countOfCurrent} diagram${this.countOfCurrent === 1 ? '' : 'men'}`;
  }
  get postfixRemoved() {
    return `${this.countOfVersioned} diagram${this.countOfVersioned === 1 ? '' : 'men'}`;
  }

  get countOfCurrent() {
    return this.args.countOfCurrent || 0;
  }

  get countOfVersioned() {
    return this.args.countOfVersioned || 0;
  }
}
