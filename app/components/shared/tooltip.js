import Component from '@glimmer/component';

export default class SharedTooltip extends Component {
  get alignment() {
    if (this.args.alignment) {
      return this.args.alignment;
    }
    return 'center';
  }

  get shouldRender() {
    if (!this.args.show) {
      return false;
    }
    if (!this.args.text || this.args.text.trim().length === 0) {
      return false;
    }
    return true;
  }
}
